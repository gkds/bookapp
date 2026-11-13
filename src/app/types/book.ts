export interface Book {
  /** Firestore document id in the `books` collection. */
  id: string;
  name: string;
  author: string;
  image: string;
  price: number;
  isbn?: string;
  year?: number;
}
