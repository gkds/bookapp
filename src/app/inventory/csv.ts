import { Book } from '../types/book';
import { CATEGORIES, CATEGORY_IDS, OTHER_CATEGORY } from '../types/category';

/** Columns of the inventory CSV file, in the order used by the template. */
export const CSV_COLUMNS = ['id', 'name', 'author', 'price', 'category', 'stock', 'image', 'isbn', 'year'] as const;
const REQUIRED_COLUMNS = ['name', 'author', 'price'];
export const MAX_IMPORT_ROWS = 2000;

export interface ImportRow {
  /** Line number in the file (1 = header), for error messages. */
  line: number;
  book: Book | null;
  errors: string[];
}

export interface ImportResult {
  rows: ImportRow[];
  /** Problems with the file itself (missing columns, empty file...). */
  fileErrors: string[];
}

/** Picks the separator: `;` for files saved by a French/European Excel, `,` otherwise. */
export function detectDelimiter(text: string): ',' | ';' {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  return (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ';' : ',';
}

/**
 * RFC 4180 parser: quoted fields may contain the separator, line breaks and
 * doubled quotes (""). Blank lines are skipped.
 */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // Excel adds a byte-order mark

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"' && field === '') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

/** Lowercase slug usable as a Firestore document id. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Accepts a category id ("testing-qa") or its label ("Software Testing & QA"), any case. */
function resolveCategory(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return OTHER_CATEGORY.id;
  if (CATEGORY_IDS.has(v)) return v;
  return CATEGORIES.find((c) => c.label.toLowerCase() === v)?.id ?? null;
}

function parseNumber(value: string): number {
  // "12,50" (decimal comma) and "£12.50" are both accepted.
  return Number(value.trim().replace(/^[£$€]/, '').replace(',', '.'));
}

/** Turns the CSV text into books, with one list of errors per line. */
export function importBooks(text: string): ImportResult {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { rows: [], fileErrors: ['The file is empty: it needs a header line and at least one book.'] };
  }
  if (table.length - 1 > MAX_IMPORT_ROWS) {
    return { rows: [], fileErrors: [`The file has ${table.length - 1} lines; import at most ${MAX_IMPORT_ROWS} at once.`] };
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      rows: [],
      fileErrors: [`Missing column(s): ${missing.join(', ')}. Expected columns: ${CSV_COLUMNS.join(', ')}.`],
    };
  }

  const seenIds = new Map<string, number>();
  const rows = table.slice(1).map((cells, index): ImportRow => {
    const line = index + 2;
    const get = (column: string) => (cells[header.indexOf(column)] ?? '').trim();
    const errors: string[] = [];

    const name = get('name');
    const author = get('author');
    if (!name) errors.push('name is required');
    if (!author) errors.push('author is required');

    const price = parseNumber(get('price'));
    if (!get('price') || !Number.isFinite(price) || price < 0) errors.push('price must be a number ≥ 0');

    const category = resolveCategory(get('category'));
    if (!category) errors.push(`unknown category "${get('category')}"`);

    let stock: number | undefined;
    if (get('stock')) {
      stock = Number(get('stock'));
      if (!Number.isInteger(stock) || stock < 0) errors.push('stock must be a whole number ≥ 0');
    }

    const image = get('image');
    if (image && !/^https:\/\/\S+$/.test(image)) errors.push('image must be an https:// URL');

    let year: number | undefined;
    if (get('year')) {
      year = Number(get('year'));
      if (!Number.isInteger(year) || year < 0 || year > 3000) errors.push('year must be a year like 2008');
    }

    const isbn = get('isbn').replace(/[\s-]/g, '');
    if (isbn && !/^(\d{9}[\dX]|\d{13})$/i.test(isbn)) errors.push('isbn must have 10 or 13 digits');

    const id = get('id') ? slugify(get('id')) : slugify(name);
    if (!id) errors.push('id (or name) must contain letters or digits');
    if (id && seenIds.has(id)) errors.push(`same id "${id}" as line ${seenIds.get(id)}`);
    else if (id) seenIds.set(id, line);

    if (errors.length > 0) return { line, book: null, errors };
    return {
      line,
      errors,
      book: {
        id,
        name,
        author,
        price: Math.round(price * 100) / 100,
        category: category!,
        image,
        stock,
        isbn: isbn || undefined,
        year,
      },
    };
  });

  return { rows, fileErrors: [] };
}

function escapeCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Inventory as CSV, in the format importBooks() reads back. */
export function booksToCsv(books: Book[]): string {
  const lines = books.map((book) =>
    CSV_COLUMNS.map((column) => escapeCell(book[column as keyof Book])).join(',')
  );
  return [CSV_COLUMNS.join(','), ...lines].join('\r\n') + '\r\n';
}
