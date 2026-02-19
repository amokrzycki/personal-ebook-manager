import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShelfDto } from '../dto/create-shelf.dto';
import { UpdateShelfDto } from '../dto/update-shelf.dto';
import { Shelf } from '../entities/shelf.entity';
import { Book } from '../entities/book.entity';

@Injectable()
export class ShelvesService {
  constructor(
    @InjectRepository(Shelf)
    private readonly shelvesRepo: Repository<Shelf>,
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  // Get all shelves with book count (without loading all books)
  async findAll(): Promise<(Shelf & { bookCount: number })[]> {
    const shelves = await this.shelvesRepo.find({
      relations: ['books'],
      order: { name: 'ASC' },
    });
    return shelves.map((s) => ({
      ...s,
      bookCount: s.books?.length ?? 0,
    }));
  }

  // Get one shelf by ID, including its books
  async findOne(id: string): Promise<Shelf> {
    const shelf = await this.shelvesRepo.findOne({
      where: { id },
      relations: ['books'],
    });
    if (!shelf) throw new NotFoundException(`Półka o ID ${id} nie istnieje`);
    return shelf;
  }

  // Create a new shelf, ensuring the name is unique
  async create(dto: CreateShelfDto): Promise<Shelf> {
    const existing = await this.shelvesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Półka o nazwie "${dto.name}" już istnieje`);
    }
    const shelf = this.shelvesRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? '#4A90D9',
      icon: dto.icon ?? 'bookmark',
    });
    return this.shelvesRepo.save(shelf);
  }

  // Update shelf details (name, description, color, icon)
  async update(id: string, dto: UpdateShelfDto): Promise<Shelf> {
    const shelf = await this.findOne(id);
    Object.assign(shelf, dto);
    return this.shelvesRepo.save(shelf);
  }

  // Remove a shelf by ID
  async remove(id: string): Promise<void> {
    const shelf = await this.findOne(id);
    await this.shelvesRepo.remove(shelf);
  }

  // Add a book to a shelf. Idempotent – does not throw if the book is already on the shelf.
  async addBook(shelfId: string, bookId: string): Promise<Shelf> {
    const shelf = await this.findOne(shelfId);
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
      relations: ['shelves'],
    });
    if (!book)
      throw new NotFoundException(`Książka o ID ${bookId} nie istnieje`);

    const alreadyAdded = (book.shelves ?? []).some((s) => s.id === shelfId);
    if (!alreadyAdded) {
      book.shelves = [...(book.shelves ?? []), shelf];
      await this.booksRepo.save(book);
    }
    return this.findOne(shelfId);
  }

  // remove a book from a shelf. Idempotent – does not throw if the book is not on the shelf.
  async removeBook(shelfId: string, bookId: string): Promise<Shelf> {
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
      relations: ['shelves'],
    });
    if (!book)
      throw new NotFoundException(`Książka o ID ${bookId} nie istnieje`);

    book.shelves = (book.shelves ?? []).filter((s) => s.id !== shelfId);
    await this.booksRepo.save(book);
    return this.findOne(shelfId);
  }
}
