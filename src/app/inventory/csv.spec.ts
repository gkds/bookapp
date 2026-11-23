import { booksToCsv, importBooks, parseCsv, slugify } from './csv';

const CATEGORIES = [
  { id: 'testing-qa', label: 'Software Testing & QA', order: 1 },
  { id: 'manga-comics', label: 'Manga & Comics', order: 2 },
];

describe('inventory CSV', () => {
  it('parses quoted fields with commas, quotes and line breaks', () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'say "hi"\nthere']]);
  });

  it('detects semicolon-separated files and decimal commas', () => {
    const { rows, fileErrors } = importBooks('name;author;price;category\nLe Livre;Auteur;12,50;Manga & Comics\n', CATEGORIES);
    expect(fileErrors).toEqual([]);
    expect(rows[0].book).toEqual(jasmine.objectContaining({ id: 'le-livre', price: 12.5, category: 'manga-comics' }));
  });

  it('reports invalid lines without rejecting the valid ones', () => {
    const csv = [
      'id,name,author,price,category,stock',
      'a,Book A,Someone,10,testing-qa,5',
      ',Book B,,abc,unknown,-1',
      'a,Book A again,Someone,10,,',
    ].join('\n');
    const { rows } = importBooks(csv, CATEGORIES);
    expect(rows[0].book?.stock).toBe(5);
    expect(rows[1].book).toBeNull();
    expect(rows[1].errors).toEqual([
      'author is required',
      'price must be a number ≥ 0',
      'unknown category "unknown"',
      'stock must be a whole number ≥ 0',
    ]);
    expect(rows[2].errors).toEqual(['same id "a" as line 2']);
  });

  it('refuses a file without the required columns', () => {
    expect(importBooks('title,price\nx,1', CATEGORIES).fileErrors.length).toBe(1);
  });

  it('round-trips an export', () => {
    const book = { id: 'x', name: 'A "quoted", title', author: 'Me', price: 9.99, category: 'other', image: '', stock: 2 };
    const { rows } = importBooks(booksToCsv([book]), CATEGORIES);
    expect(rows[0].book).toEqual(jasmine.objectContaining(book));
  });

  it('slugifies titles', () => {
    expect(slugify('  Élégant Code: 2nd Ed. ')).toBe('elegant-code-2nd-ed');
  });
});
