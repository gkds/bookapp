import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Book } from './types/book';

/** Firestore allows at most 500 writes per batch. */
const BATCH_SIZE = 400;

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

  /** Forgets the cached catalog, so the next getBooks() reads Firestore again. */
  refresh(): Promise<Book[]> {
    this.books = null;
    return this.getBooks();
  }

  /**
   * Creates or replaces books (admin only, enforced by the security rules).
   * A book whose id already exists is overwritten, so re-importing the same
   * file never creates duplicates.
   */
  async saveBooks(books: Book[]): Promise<void> {
    for (let start = 0; start < books.length; start += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const { id, ...book } of books.slice(start, start + BATCH_SIZE)) {
        // Firestore rejects undefined values: drop optional fields that are not set.
        const data = Object.fromEntries(Object.entries(book).filter(([, value]) => value !== undefined));
        batch.set(doc(db, 'books', id), data);
      }
      await batch.commit();
    }
    this.books = null;
  }

  /** Removes a book from the catalog (admin only). */
  async deleteBook(id: string): Promise<void> {
    await deleteDoc(doc(db, 'books', id));
    this.books = null;
  }

  private async load(): Promise<Book[]> {
    const snapshot = await getDocs(collection(db, 'books'));
    return snapshot.docs
      .map((d) => ({ ...d.data(), id: d.id } as Book))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
