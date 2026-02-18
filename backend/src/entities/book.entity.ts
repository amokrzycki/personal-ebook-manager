import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  /** Date when the book was added to the library */
  @CreateDateColumn()
  createdAt: Date;

  /** Date of the last modification */
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields (not persisted in the database)

  /**
   * Returns reading progress percentage (0–100).
   * Computed on the fly – not a database column.
   */
  get readingProgressPercent(): number {
    if (!this.totalPages || this.totalPages === 0) return 0;
    return Math.min(
      100,
      Math.round((this.currentPage / this.totalPages) * 100),
    );
  }
}
