import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Book } from './types/book';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private books: Promise<Book[]> | null = null;

  /** All catalog books, sorted by title. Loaded once, then cached. */
  getBooks(): Promise<Book[]> {
    if (!this.books) {
      this.books = this.load().catch((error) => {
        this.books = null; // allow a retry after a failure
        throw error;
      });
    }
    return this.books;
  }

  private async load(): Promise<Book[]> {
    const snapshot = await getDocs(collection(db, 'books'));
    return snapshot.docs
      .map((d) => ({ ...d.data(), id: d.id } as Book))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
