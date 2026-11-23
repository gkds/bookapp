import { Component, OnInit } from '@angular/core';
import { BookService } from '../book.service';
import { Book } from '../types/book';
import { CategoryService } from '../category.service';
import { Category } from '../types/category';
import { booksToCsv, ImportResult, ImportRow, importBooks } from './csv';

/** Larger files are refused before reading them. */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
})
export class InventoryComponent implements OnInit {
  categories: Category[] = [];

  books: Book[] = [];
  isLoading = true;
  loadError: string | null = null;

  fileName: string | null = null;
  preview: ImportResult | null = null;
  isDragging = false;
  isImporting = false;
  importError: string | null = null;
  importMessage: string | null = null;

  deletingId: string | null = null;

  constructor(private bookService: BookService, private categoryService: CategoryService) {}

  categoryLabel(id: string | undefined): string {
    return this.categoryService.labelOf(id);
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    try {
      [this.books, this.categories] = await Promise.all([
        this.bookService.refresh(),
        this.categoryService.refresh(),
      ]);
    } catch {
      this.loadError = 'The inventory could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  get validRows(): ImportRow[] {
    return this.preview?.rows.filter((r) => r.book) ?? [];
  }

  get invalidRows(): ImportRow[] {
    return this.preview?.rows.filter((r) => !r.book) ?? [];
  }

  /** True when the row's book id already exists: the import will update it. */
  isUpdate(row: ImportRow): boolean {
    return !!row.book && this.books.some((b) => b.id === row.book!.id);
  }

  get newCount(): number {
    return this.validRows.filter((r) => !this.isUpdate(r)).length;
  }

  get totalStock(): number {
    return this.books.reduce((sum, b) => sum + (b.stock ?? 0), 0);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
    input.value = ''; // selecting the same file again re-reads it
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  async readFile(file: File): Promise<void> {
    this.importMessage = null;
    this.importError = null;
    this.fileName = file.name;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      this.preview = { rows: [], fileErrors: ['Choose a .csv file.'] };
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.preview = { rows: [], fileErrors: ['The file is larger than 2 MB.'] };
      return;
    }
    this.preview = importBooks(await file.text(), this.categories);
  }

  cancelImport(): void {
    this.preview = null;
    this.fileName = null;
  }

  async confirmImport(): Promise<void> {
    const books = this.validRows.map((r) => r.book!);
    if (books.length === 0 || this.isImporting) return;

    this.isImporting = true;
    this.importError = null;
    try {
      const created = this.newCount;
      await this.bookService.saveBooks(books);
      this.importMessage = `${books.length} book(s) imported: ${created} added, ${books.length - created} updated.`;
      this.preview = null;
      this.fileName = null;
      await this.load();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      this.importError =
        code === 'permission-denied'
          ? 'Import refused: your account is not an admin in Firestore (log out and in again after `npm run set-admin`).'
          : 'The import failed. Nothing or only part of the file may have been saved; you can import it again safely.';
    } finally {
      this.isImporting = false;
    }
  }

  async deleteBook(book: Book): Promise<void> {
    if (!confirm(`Delete "${book.name}" from the catalog?`)) return;
    this.deletingId = book.id;
    try {
      await this.bookService.deleteBook(book.id);
      this.books = this.books.filter((b) => b.id !== book.id);
    } catch {
      this.loadError = `"${book.name}" could not be deleted.`;
    } finally {
      this.deletingId = null;
    }
  }

  downloadTemplate(): void {
    const example: Book[] = [
      {
        id: 'clean-code',
        name: 'Clean Code',
        author: 'Robert C. Martin',
        price: 50,
        category: 'software-craftsmanship',
        stock: 10,
        image: 'https://images2.medimops.eu/product/e5315c/M00132350882-large.jpg',
        isbn: '9780132350884',
        year: 2008,
      },
    ];
    this.download(booksToCsv(example), 'inventory-template.csv');
  }

  exportInventory(): void {
    this.download(booksToCsv(this.books), `inventory-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  trackById(_: number, book: Book): string {
    return book.id;
  }

  private download(content: string, fileName: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
