// Loads data/categories.json and data/books.json into the Firestore
// `categories` and `books` collections.
//
//   npm run seed:emulators   -> local Firestore emulator (must be running)
//   npm run seed:books       -> the real Firebase project; needs Google
//                               credentials: `gcloud auth application-default login`
//                               or GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>
//
// Re-running is safe: each book is written under its own id, so existing
// books are updated, not duplicated. Books and categories removed from the JSON
// files are not deleted from Firestore. Categories changed on /admin/categories
// are overwritten by the JSON file for the ids it contains.
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const useEmulator = process.argv.includes('--emulator');
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
}

const projectId = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url))).projects.default;
const books = JSON.parse(readFileSync(new URL('../data/books.json', import.meta.url)));

const categories = JSON.parse(readFileSync(new URL('../data/categories.json', import.meta.url)));
const CATEGORY_IDS = new Set([...categories.map((c) => c.id), 'other']);

const categoryProblems = categories.flatMap((c, i) => {
  const errors = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id ?? '') || c.id === 'other') errors.push('id must be a lowercase slug other than "other"');
  if (typeof c.label !== 'string' || !c.label) errors.push('label is required');
  if (!Number.isInteger(c.order)) errors.push('order must be a whole number');
  return errors.map((e) => `category #${i + 1} (${c.id ?? '?'}): ${e}`);
});

const problems = books.flatMap((book, i) => {
  const errors = [];
  if (!/^[a-z0-9-]+$/.test(book.id ?? '')) errors.push('id must be a lowercase slug');
  if (typeof book.name !== 'string' || !book.name) errors.push('name is required');
  if (typeof book.author !== 'string' || !book.author) errors.push('author is required');
  if (typeof book.image !== 'string' || !book.image.startsWith('https://')) errors.push('image must be an https URL');
  if (typeof book.price !== 'number' || book.price < 0) errors.push('price must be a positive number');
  if (!CATEGORY_IDS.has(book.category)) errors.push(`category must be one of: ${[...CATEGORY_IDS].join(', ')}`);
  if (book.stock !== undefined && !(Number.isInteger(book.stock) && book.stock >= 0)) errors.push('stock must be a whole number >= 0');
  return errors.map((e) => `book #${i + 1} (${book.id ?? '?'}): ${e}`);
});
if (categoryProblems.length + problems.length > 0) {
  console.error([...categoryProblems, ...problems].join('\n'));
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();

const batch = db.batch();
for (const { id, ...category } of categories) {
  batch.set(db.collection('categories').doc(id), category);
}
for (const { id, ...book } of books) {
  batch.set(db.collection('books').doc(id), book);
}
await batch.commit();

console.log(`${categories.length} categories and ${books.length} books written to ${useEmulator ? 'the Firestore emulator' : `project ${projectId}`}.`);
