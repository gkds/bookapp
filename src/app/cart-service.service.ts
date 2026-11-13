import { Injectable } from '@angular/core';
import { Book } from './types/book';

export interface CartItem {
  book: Book;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartServiceService {
  private items: CartItem[] = [];

  /** Adds one copy of the book, grouping copies of the same book on one line. */
  addToCart(book: Book): void {
    const item = this.findItem(book);
    if (item) {
      item.quantity++;
    } else {
      this.items = [...this.items, { book, quantity: 1 }];
    }
  }

  get(): CartItem[] {
    return this.items;
  }

  /** Removes a single copy of the book; the line disappears at quantity 0. */
  remove(book: Book): void {
    const item = this.findItem(book);
    if (!item) return;

    item.quantity--;
    if (item.quantity <= 0) {
      this.items = this.items.filter((i) => i !== item);
    }
  }

  clear(): void {
    this.items = [];
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  }

  private findItem(book: Book): CartItem | undefined {
    // Books have no id yet: identify them by name and author.
    return this.items.find((i) => i.book.name === book.name && i.book.author === book.author);
  }
}
