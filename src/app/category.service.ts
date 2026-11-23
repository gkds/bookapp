import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Category, OTHER_CATEGORY } from './types/category';

/** Book categories, read from the Firestore `categories` collection. */
@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categories: Promise<Category[]> | null = null;
  /** Last loaded list, for synchronous lookups such as labelOf(). */
  private loaded: Category[] = [];

  /** All categories, sorted by `order`. Loaded once, then cached. */
  getCategories(): Promise<Category[]> {
    if (!this.categories) {
      this.categories = this.load().catch((error) => {
        this.categories = null; // allow a retry after a failure
        throw error;
      });
    }
    return this.categories;
  }

  refresh(): Promise<Category[]> {
    this.categories = null;
    return this.getCategories();
  }

  /** Label of a category id; "Other" for an unknown or missing id. */
  labelOf(id: string | undefined): string {
    return this.loaded.find((c) => c.id === id)?.label ?? OTHER_CATEGORY.label;
  }

  /** The book's category id if it exists, otherwise "other". */
  resolve(id: string | undefined): string {
    return this.loaded.some((c) => c.id === id) ? id! : OTHER_CATEGORY.id;
  }

  /** Creates or updates a category (admin only, enforced by the security rules). */
  async save(category: Category): Promise<void> {
    await setDoc(doc(db, 'categories', category.id), { label: category.label, order: category.order });
    this.categories = null;
  }

  /** Saves the new position of every category in one write. */
  async saveOrder(categories: Category[]): Promise<void> {
    const batch = writeBatch(db);
    categories.forEach((c, index) => batch.update(doc(db, 'categories', c.id), { order: index + 1 }));
    await batch.commit();
    this.categories = null;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', id));
    this.categories = null;
  }

  private async load(): Promise<Category[]> {
    const snapshot = await getDocs(collection(db, 'categories'));
    this.loaded = snapshot.docs
      .map((d) => ({ order: 0, ...d.data(), id: d.id } as Category))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    return this.loaded;
  }
}
