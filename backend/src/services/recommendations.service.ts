/**
 * 1. Authors as profile features
 * The author of a favorite book receives a weight = rating/5 * AUTHOR_BOOST (1.5×),
 * so that other books by the same author are prioritized over random genre matches.
 *
 * 2. External Candidates from the Google Books API
 * When a local library has < MIN_LOCAL_CANDIDATES candidates, the service
 * queries Google Books for titles that match the profile and includes them
 * (marked with the externalSuggestion: true flag) in the results.
 * The frontend can display them with a different icon ("Check out this book").
 *
 * 3. Deduplication
 * External results are filtered by ISBN to avoid duplicating
 * books already in the library.
 *
 * Cosine similarity formula (simplified):
 * score(book) = dotProduct(bookVector, profileVector) / |profileVector|
 * where:
 * bookVector[feature] = 1 if the book has this feature, 0 if the book has this feature.
 * * profileVector[feature] = sum of weights for this feature from favorites
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, ReadingStatus, BookFormat } from '../entities/book.entity';
import { GoogleBooksService } from './google-books.service';

export interface ScoredBook {
  book: Book | Partial<Book>;
  score: number;
  matchedFeatures: string[];
  /** true = external suggestion from Google Books (not from local database) */
  isExternal: boolean;
}

/** Increases the weight of the author relative to the weight of the genre */
const AUTHOR_BOOST = 1.5;
/** Minimum number of local candidates; below - we reach for the API */
const MIN_LOCAL_CANDIDATES = 3;

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly MIN_RATING = 3;
  private readonly TOP_N = 12;

  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    private readonly googleBooks: GoogleBooksService,
  ) {}

  async getRecommendations(): Promise<ScoredBook[]> {
    const allBooks = await this.booksRepo.find();

    // Step 1: Identify favorites (rated >= MIN_RATING and finished)
    const favorites = allBooks.filter(
      (b) =>
        b.rating !== null &&
        b.rating >= this.MIN_RATING &&
        b.status === ReadingStatus.FINISHED,
    );

    if (favorites.length === 0) {
      this.logger.log('Brak ulubionych – rekomendacje niemożliwe');
      return [];
    }

    // Step 2: Build the profile vector from favorites
    const profile = this.buildProfile(favorites);

    // Step 3: Score local candidates (unread or in progress)
    const localCandidates = allBooks.filter(
      (b) =>
        b.status === ReadingStatus.UNREAD ||
        b.status === ReadingStatus.IN_PROGRESS,
    );

    const localScored: ScoredBook[] = localCandidates
      .map((b) => ({ ...this.scoreBook(b, profile), isExternal: false }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.TOP_N);

    // Step 4: If not enough local candidates, fetch external suggestions
    if (localScored.length < MIN_LOCAL_CANDIDATES) {
      const externalBooks = await this.fetchExternalSuggestions(
        profile,
        allBooks,
      );
      const combined = [...localScored, ...externalBooks]
        .sort((a, b) => b.score - a.score)
        .slice(0, this.TOP_N);
      this.logger.log(
        `Rekomendacje: ${localScored.length} lok. + ${externalBooks.length} zew.`,
      );
      return combined;
    }

    this.logger.log(`Rekomendacje: ${localScored.length} lokalnych`);
    return localScored;
  }

  /* Build a profile vector from the user's favorite books. Each feature (genre, tag, author, format)
    receives a weight based on the book's rating and the AUTHOR_BOOST for authors.
   */
  private buildProfile(favorites: Book[]): Map<string, number> {
    const profile = new Map<string, number>();

    const add = (key: string, weight: number) => {
      profile.set(key, (profile.get(key) ?? 0) + weight);
    };

    for (const book of favorites) {
      const w = (book.rating ?? 3) / 5; // normalize rating to [0.6, 1]

      for (const g of book.genres ?? [])
        add(`genre:${g.toLowerCase().trim()}`, w);
      for (const t of book.tags ?? []) add(`tag:${t.toLowerCase().trim()}`, w);

      // Boost author
      add(`author:${book.author.toLowerCase().trim()}`, w * AUTHOR_BOOST);

      // Format also gets some weight, but less than genre/author
      add(`format:${book.format}`, w * 0.5);
    }

    return profile;
  }

  private scoreBook(
    book: Book | Partial<Book>,
    profile: Map<string, number>,
  ): Omit<ScoredBook, 'isExternal'> {
    const features: string[] = [
      ...(book.genres ?? []).map((g) => `genre:${g.toLowerCase().trim()}`),
      ...(book.tags ?? []).map((t) => `tag:${t.toLowerCase().trim()}`),
      `author:${(book.author ?? '').toLowerCase().trim()}`,
      `format:${book.format ?? BookFormat.OTHER}`,
    ];

    let dot = 0;
    const matched: string[] = [];

    for (const f of features) {
      const w = profile.get(f) ?? 0;
      if (w > 0) {
        dot += w;
        matched.push(f.split(':').slice(1).join(':'));
      }
    }

    const magnitude = Math.sqrt(
      [...profile.values()].reduce((s, w) => s + w * w, 0),
    );
    return {
      book,
      score: magnitude > 0 ? dot / magnitude : 0,
      matchedFeatures: [...new Set(matched)],
    };
  }

  /** Fetch suggestions from Google Books based on top genres in the profile.
   * Only books that are not already in the local library (by ISBN or title) are considered.
   * The returned suggestions are scored using the same profile and marked as external.
   * This method is called only if there are too few local candidates, to enrich the recommendations.
   */
  private async fetchExternalSuggestions(
    profile: Map<string, number>,
    existingBooks: Book[],
  ): Promise<ScoredBook[]> {
    // Identify top genres from the profile to query the API. We take the top 3 genres with the highest weights.
    const topGenres = [...profile.entries()]
      .filter(([k]) => k.startsWith('genre:'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k.replace('genre:', ''));

    if (topGenres.length === 0) return [];

    const existingIsbns = new Set(
      existingBooks.map((b) => b.isbn).filter(Boolean),
    );
    const existingTitles = new Set(
      existingBooks.map((b) => b.title.toLowerCase()),
    );

    const suggestions: ScoredBook[] = [];

    for (const genre of topGenres) {
      try {
        const meta = await this.googleBooks.searchByGenre(genre);
        for (const book of meta) {
          // Skip if the book is already in the local library (by ISBN or title)
          if (book.isbn && existingIsbns.has(book.isbn)) continue;
          if (book.title && existingTitles.has(book.title.toLowerCase()))
            continue;

          const scored = this.scoreBook(book, profile);
          if (scored.score > 0) {
            suggestions.push({ ...scored, isExternal: true });
          }
        }
      } catch (e) {
        this.logger.warn(
          `Google Books genre search failed for "${genre}": ${e}`,
        );
      }
    }

    // Deduplicate suggestions by title (in case multiple genres return the same book) and sort by score
    const seen = new Set<string>();
    return suggestions
      .filter((s) => {
        const key = (s.book.title ?? '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }
}
