import { Injectable } from '@angular/core';
import { User } from 'firebase/auth';
import { doc, DocumentReference, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AuthService } from './auth/authService';
import { db } from './firebase';
import { Book } from './types/book';

export interface CartItem {
  book: Book;
  quantity: number;
}

/**
 * Shopping cart. Visitors keep a cart in memory; once logged in, the cart is
 * stored in Firestore under `carts/{uid}` and any items added before login
 * are merged into it.
 */
@Injectable({
  providedIn: 'root',
})
export class CartServiceService {
  private items: CartItem[] = [];
  private uid: string | null = null;

  /** Set when the cart could not be loaded or saved. */
  syncError: string | null = null;

  constructor(authService: AuthService) {
    authService.user$.subscribe((user) => this.onUserChanged(user));
  }

  /** Firestore document holding a user's cart. */
  static cartRef(uid: string): DocumentReference {
    return doc(db, 'carts', uid);
  }

  /** Adds one copy of the book, grouping copies of the same book on one line. */
  addToCart(book: Book): void {
    const item = this.findItem(this.items, book);
    if (item) {
      item.quantity++;
    } else {
      this.items = [...this.items, { book, quantity: 1 }];
    }
    this.save();
  }

  get(): CartItem[] {
    return this.items;
  }

  /** Removes a single copy of the book; the line disappears at quantity 0. */
  remove(book: Book): void {
    const item = this.findItem(this.items, book);
    if (!item) return;

    item.quantity--;
    if (item.quantity <= 0) {
      this.items = this.items.filter((i) => i !== item);
    }
    this.save();
  }

  /**
   * Empties the in-memory cart only. Used after an order, whose write batch
   * already empties the stored cart.
   */
  clearLocal(): void {
    this.items = [];
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  }

  private async onUserChanged(user: User | null): Promise<void> {
    if ((user?.uid ?? null) === this.uid) return;

    if (!user) {
      // Logged out: the cart stays saved in Firestore, but is no longer shown.
      this.uid = null;
      this.items = [];
      return;
    }

    this.uid = user.uid;
    this.syncError = null;
    try {
      const snapshot = await getDoc(CartServiceService.cartRef(user.uid));
      if (this.uid !== user.uid) return; // the user changed while loading

      const saved = this.parseItems(snapshot.data()?.['items']);
      // Items added before login, or while the saved cart was loading.
      const local = this.items;
      this.items = this.merge(saved, local);
      if (local.length > 0) this.save();
    } catch {
      this.syncError = 'Your saved cart could not be loaded.';
    }
  }

  /** Writes the cart to Firestore when a user is logged in. */
  private async save(): Promise<void> {
    if (!this.uid) return;
    try {
      await setDoc(CartServiceService.cartRef(this.uid), {
        items: this.items.map((item) => ({ book: { ...item.book }, quantity: item.quantity })),
        updatedAt: serverTimestamp(),
      });
      this.syncError = null;
    } catch {
      this.syncError = 'Your cart could not be saved. Changes may be lost on reload.';
    }
  }

  private merge(saved: CartItem[], local: CartItem[]): CartItem[] {
    const merged = saved.map((item) => ({ ...item }));
    for (const item of local) {
      const existing = this.findItem(merged, item.book);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push({ ...item });
      }
    }
    return merged;
  }

  /** Keeps only well-formed items from data read from Firestore. */
  private parseItems(data: unknown): CartItem[] {
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is CartItem =>
        typeof item?.book?.name === 'string' &&
        typeof item?.book?.price === 'number' &&
        Number.isInteger(item?.quantity) &&
        item.quantity > 0
    );
  }

  private findItem(items: CartItem[], book: Book): CartItem | undefined {
    // Books have no id yet: identify them by name and author.
    return items.find((i) => i.book.name === book.name && i.book.author === book.author);
  }
}
