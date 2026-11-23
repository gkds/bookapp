import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Book } from './../types/book';
import { categoryLabel } from '../types/category';

/** At or below this stock, the card shows "Only N left". */
const LOW_STOCK = 3;

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css'],
})
export class BookComponent {
  @Input() book: Book = {} as Book;
  @Output() bookEmitter = new EventEmitter<Book>();

  /** Set when the cover cannot be loaded, to show a placeholder instead. */
  imageFailed = false;

  get category(): string {
    return categoryLabel(this.book.category);
  }

  get isOutOfStock(): boolean {
    return this.book.stock === 0;
  }

  get isLowStock(): boolean {
    return this.book.stock !== undefined && this.book.stock > 0 && this.book.stock <= LOW_STOCK;
  }

  addToCart(): void {
    if (!this.isOutOfStock) this.bookEmitter.emit(this.book);
  }
}
