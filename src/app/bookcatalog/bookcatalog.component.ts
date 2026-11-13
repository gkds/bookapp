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
    } catch {
      this.error = 'The catalog could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  addToCart(book: Book): void {
    this.cartService.addToCart(book);
  }

  trackById(_: number, book: Book): string {
    return book.id;
  }
}
