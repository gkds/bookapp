export interface Category {
  /** Stable identifier stored on each book (`book.category`). */
  id: string;
  label: string;
}

/**
 * Book categories of the store. The ids are stored in Firestore and used in
 * CSV imports, so they must not be renamed once books use them; labels can
 * change freely.
 */
export const CATEGORIES: readonly Category[] = [
  { id: 'software-craftsmanship', label: 'Software Craftsmanship' },
  { id: 'architecture-design', label: 'Architecture & Design' },
  { id: 'programming-languages', label: 'Programming Languages' },
  { id: 'testing-qa', label: 'Software Testing & QA' },
  { id: 'algorithms-cs', label: 'Algorithms & Computer Science' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'data-ai', label: 'Data Science & AI' },
  { id: 'devops-cloud', label: 'DevOps & Cloud' },
  { id: 'management-agile', label: 'Project Management & Agile' },
  { id: 'manga-comics', label: 'Manga & Comics' },
];

/** Category used for books that have none (e.g. imported before categories existed). */
export const OTHER_CATEGORY: Category = { id: 'other', label: 'Other' };

export const CATEGORY_IDS: ReadonlySet<string> = new Set([...CATEGORIES.map((c) => c.id), OTHER_CATEGORY.id]);

export function categoryLabel(id: string | undefined): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? OTHER_CATEGORY.label;
}
