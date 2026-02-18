/**
 * recommendations.service.ts
 * ──────────────────────────
 * Silnik rekomendacji oparty na content-based filtering.
 *
 * Algorytm:
 * ─────────
 * 1. Pobieramy wszystkie "ulubione" książki użytkownika (rating >= 4
 *    LUB status = FINISHED z rating >= 3).
 * 2. Budujemy "profil preferencji" – słownik {cecha: waga}, gdzie cechami
 *    są gatunki i tagi. Waga rośnie proporcjonalnie do oceny.
 * 3. Dla każdej nieprzeczytanej książki obliczamy wynik podobieństwa
 *    (cosine similarity uproszczona do iloczynu skalarnego na znormalizowanych
 *    wektorach). Im wyższy wynik, tym lepsza rekomendacja.
 * 4. Zwracamy Top-N pozycji posortowanych malejąco po wyniku.
 *
 * Kompromisy (MVP):
 * ─────────────────
 * - Nie używamy ML – czyste JavaScript. Wystarczy na potrzeby demo.
 * - Nie obsługujemy "cold start" (brak ulubionych) – zwracamy pustą listę.
 * - Rozszerzenie: można dodać collaborative filtering po zebraniu większej
 *   ilości danych użytkowników.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, ReadingStatus } from '../entities/book.entity';

export interface ScoredBook {
  book: Book;
  score: number;
  matchedFeatures: string[]; // features that “fit”, useful in UI
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly MIN_RATING_FOR_PROFILE = 3; // threshold score (inclusive)
  private readonly TOP_N = 10; // maximum number of recommendations

  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  /**
   * Generates recommendations for the current user.
   * Returns an array of books with similarity scores and a list of matching features.
   */
  async getRecommendations(): Promise<ScoredBook[]> {
    const allBooks = await this.booksRepo.find();

    // Step 1: Divide into favorites and candidates
    const favoriteBooks = allBooks.filter(
      (b) =>
        b.rating !== null &&
        b.rating >= this.MIN_RATING_FOR_PROFILE &&
        b.status === ReadingStatus.FINISHED,
    );

    if (favoriteBooks.length === 0) {
      this.logger.log(
        'Brak ulubionych książek – nie można wygenerować rekomendacji',
      );
      return [];
    }

    // Candidates: books not yet read (not FINISHED and not ABANDONED)
    const candidates = allBooks.filter(
      (b) =>
        b.status === ReadingStatus.UNREAD ||
        b.status === ReadingStatus.IN_PROGRESS,
    );

    if (candidates.length === 0) return [];

    // Step 2: Building a preference profile
    const profile = this.buildUserProfile(favoriteBooks);

    // Steps 3 & 4: Scoring and sorting
    const scored: ScoredBook[] = candidates
      .map((book) => this.scoreBook(book, profile))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.TOP_N);

    this.logger.log(`Wygenerowano ${scored.length} rekomendacji`);
    return scored;
  }

  /**
   * Builds a preference profile: sums the weights (= rating / 5) for each
   * genre and tag in favorite books.
   *
   * Example: three fantasy books with ratings of 5, 4, and 3 give a profile of
   * { “fantasy”: 5/5 + 4/5 + 3/5 = 2.4 }
   */
  private buildUserProfile(favorites: Book[]): Map<string, number> {
    const profile = new Map<string, number>();

    for (const book of favorites) {
      const normalizedRating = (book.rating ?? 3) / 5;
      const features = [...(book.genres ?? []), ...(book.tags ?? [])].map((f) =>
        f.toLowerCase().trim(),
      );

      for (const feature of features) {
        profile.set(feature, (profile.get(feature) ?? 0) + normalizedRating);
      }
    }

    return profile;
  }

  /**
   * Calculates the similarity score between a book and a user profile.
   * We use a simplified version of cosine similarity:
   *   score = Σ(profile[feature]) for features common with the book
   *
   * We normalize by the square root of the sum of the squares of the profile weights,
   * so that a feature with 10 mentions does not dominate a feature with 1 mention.
   */
  private scoreBook(book: Book, profile: Map<string, number>): ScoredBook {
    const bookFeatures = [...(book.genres ?? []), ...(book.tags ?? [])].map(
      (f) => f.toLowerCase().trim(),
    );

    let dotProduct = 0;
    const matchedFeatures: string[] = [];

    for (const feature of bookFeatures) {
      const profileWeight = profile.get(feature) ?? 0;
      if (profileWeight > 0) {
        dotProduct += profileWeight;
        matchedFeatures.push(feature);
      }
    }

    // Normalization of profile magnitude (prevents favoring of “active” profiles)
    const profileMagnitude = Math.sqrt(
      [...profile.values()].reduce((sum, w) => sum + w * w, 0),
    );
    const score = profileMagnitude > 0 ? dotProduct / profileMagnitude : 0;

    return { book, score, matchedFeatures };
  }
}
