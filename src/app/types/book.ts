export interface Book {
  /** Firestore document id in the `books` collection. */
  id: string;
  name: string;
  author: string;
  image: string;
  price: number;
  /** Id of a document in the `categories` collection (see data/categories.json). */
  category?: string;
  /** Copies available; undefined means "not tracked" (always available). */
  stock?: number;
  isbn?: string;
  /** Year of first publication (negative for BCE). */
  year?: number;
}
