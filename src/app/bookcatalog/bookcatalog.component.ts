import { Component, OnInit } from '@angular/core';
import { BookService } from '../book.service';
import { CartServiceService } from '../cart-service.service';
import { Book } from '../types/book';

@Component({
  selector: 'bookcatalog',
  templateUrl: './bookcatalog.component.html',
  styleUrls: ['./bookcatalog.component.css'],
})
export class BookcatalogComponent implements OnInit {
  catalog: Book[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private bookService: BookService, private cartService: CartServiceService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      this.catalog = await this.bookService.getBooks();
    } catch (error) {
      console.error('Catalog load failed', error);
      this.error = this.describe(error);
    } finally {
      this.isLoading = false;
    }
  }

  addToCart(book: Book): void {
    this.cartService.addToCart(book);
  }

  private describe(error: unknown): string {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case 'permission-denied':
        return 'The catalog could not be loaded: access refused by the Firestore security rules (deploy them with `npm run deploy:rules`).';
      case 'unavailable':
        return 'The catalog could not be loaded: Firestore is unreachable (check your connection, or start the emulators with `npm run emulators`).';
      default:
        return `The catalog could not be loaded${code ? ` (${code})` : ''}.`;
    }
  }

  trackById(_: number, book: Book): string {
    return book.id;
  }
}
