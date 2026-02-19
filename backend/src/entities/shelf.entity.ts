import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Entity('shelves')
export class Shelf {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Name of the shelf (e.g., "Sci-Fi", "Favorites", "To Read")
  @Column({ type: 'varchar', length: 128, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null;

  /** Color in hex format (e.g., "#4A90D9") */
  @Column({ type: 'varchar', length: 7, default: '#4A90D9' })
  color: string;

  // Optional icon name (e.g., "bookmark", "star", "heart") – can be used in the frontend to display an icon for the shelf
  @Column({ type: 'varchar', length: 32, default: 'bookmark' })
  icon: string;

  // Many-to-many relationship with books
  @ManyToMany(() => Book, (book) => book.shelves)
  books: Book[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
