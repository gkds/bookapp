/** A document of the Firestore `categories` collection (managed on /admin/categories). */
export interface Category {
  /** Document id, stored on each book (`book.category`). Never changes once created. */
  id: string;
  label: string;
  /** Position in menus and lists, smallest first. */
  order: number;
}

/**
 * Built-in fallback, not stored in Firestore: books without a category, or
 * whose category was deleted, are shown under it.
 */
export const OTHER_CATEGORY: Category = { id: 'other', label: 'Other', order: Number.MAX_SAFE_INTEGER };

/** Valid category id: lowercase letters, digits and dashes. */
export const CATEGORY_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
