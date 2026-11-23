export interface Book {
  /** Firestore document id in the `books` collection. */
  id: string;
  name: string;
  author: string;
  image: string;
  price: number;
  /** e.g. programming, literature, philosophy, cooking. */
  category?: string;
  isbn?: string;
  /** Year of first publication (negative for BCE). */
  year?: number;
  /** Copies in stock (inventory files only; not used by the app yet). */
  stock?: number;
}
