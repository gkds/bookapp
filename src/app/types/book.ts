export interface Book {
  /** Firestore document id in the `books` collection. */
  id: string;
  name: string;
  author: string;
  image: string;
  price: number;
  /** One of the ids of `CATEGORIES` (see types/category.ts). */
  category?: string;
  /** Copies available; undefined means "not tracked" (always available). */
  stock?: number;
  isbn?: string;
  year?: number;
}
