import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Shelf } from './shelf.entity';

export enum BookFormat {
  EPUB = 'epub',
  MOBI = 'mobi',
  PDF = 'pdf',
  AZW = 'azw',
  CBR = 'cbr',
  CBZ = 'cbz',
  MP3 = 'mp3',
  M4B = 'm4b',
  OTHER = 'other',
}

export const AUDIO_FORMATS = new Set([BookFormat.MP3, BookFormat.M4B]);

/** Possible reading progress statuses */
export enum ReadingStatus {
  UNREAD = 'unread', // Not started
  IN_PROGRESS = 'in_progress', // Currently reading
  FINISHED = 'finished', // Completed
  ABANDONED = 'abandoned', // Abandoned
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Core metadata

  @Column({ type: 'varchar', length: 512 })
  title: string;

  @Column({ type: 'varchar', length: 256 })
  author: string;

  /** Optional series field (e.g., "The Witcher #1") */
  @Column({ type: 'varchar', length: 256, nullable: true })
  series: string | null;

  /** Series number – useful for sorting */
  @Column({ type: 'float', nullable: true })
  seriesNumber: number | null;

  /** ISBN-10 or ISBN-13 – used to fetch metadata from Google Books */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  isbn: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  coverUrl: string | null;

  /** Publication year */
  @Column({ type: 'int', nullable: true })
  publishedYear: number | null;

  /** Publisher name */
  @Column({ type: 'varchar', length: 256, nullable: true })
  publisher: string | null;

  /** Total number of pages (used to calculate reading progress) */
  @Column({ type: 'int', nullable: true })
  totalPages: number | null;

  @Column({ type: 'varchar', default: BookFormat.OTHER })
  format: BookFormat;

  // Audio-specific metadata

  // Total duration in seconds (for audiobooks) – used to calculate listening progress
  @Column({ type: 'int', nullable: true })
  audioDurationSeconds: number | null;

  // Current listening position in seconds (for audiobooks)
  @Column({ type: 'int', default: 0 })
  audioProgressSeconds: number;

  // Classification and tags

  /**
   * Literary genres (e.g., ["fantasy", "horror"]).
   * Stored as a JSON array in SQLite.
   */
  @Column({ type: 'simple-json', nullable: true })
  genres: string[] | null;

  /**
   * Custom user-defined tags (e.g., ["favorite", "to-buy"]).
   * Used by the recommendation engine (content-based filtering).
   */
  @Column({ type: 'simple-json', nullable: true })
  tags: string[] | null;

  // Progress and rating

  @Column({ type: 'varchar', default: ReadingStatus.UNREAD })
  status: ReadingStatus;

  /** Current page reached */
  @Column({ type: 'int', default: 0 })
  currentPage: number;

  /**
   * User rating (1–5 stars, null = not rated).
   * The recommendation engine considers books with rating >= 4.
   */
  @Column({ type: 'float', nullable: true })
  rating: number | null;

  // Virtual Shelf's
  @ManyToMany(() => Shelf, (shelf) => shelf.books, { eager: false })
  @JoinTable({ name: 'book_shelves' })
  shelves: Shelf[];

  /** Date when the book was added to the library */
  @CreateDateColumn()
  createdAt: Date;

  /** Date of the last modification */
  @UpdateDateColumn()
  updatedAt: Date;
}
