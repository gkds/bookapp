import { Component, OnInit } from '@angular/core';
import { BookService } from '../book.service';
import { CategoryService } from '../category.service';
import { slugify } from '../inventory/csv';
import { Book } from '../types/book';
import { Category, CATEGORY_ID_PATTERN, OTHER_CATEGORY } from '../types/category';

const MAX_LABEL_LENGTH = 60;

/** Admin page: create, rename, reorder and delete the book categories. */
@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  readonly other = OTHER_CATEGORY;
  readonly maxLabelLength = MAX_LABEL_LENGTH;

  categories: Category[] = [];
  books: Book[] = [];
  isLoading = true;
  isSaving = false;
  error: string | null = null;
  message: string | null = null;

  // New category form
  newLabel = '';
  newId = '';
  /** False once the admin types the id themselves. */
  private idFollowsLabel = true;
  addError: string | null = null;

  // Rename
  editingId: string | null = null;
  editLabel = '';
  editError: string | null = null;

  // Delete (with the category whose books it holds should move to)
  deleting: Category | null = null;
  moveTo = OTHER_CATEGORY.id;

  constructor(private categoryService: CategoryService, private bookService: BookService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      [this.categories, this.books] = await Promise.all([
        this.categoryService.refresh(),
        this.bookService.refresh(),
      ]);
    } catch {
      this.error = 'The categories could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  /** Books in this category ("other": books with no, or an unknown, category). */
  booksIn(id: string): Book[] {
    return this.books.filter((b) => this.categoryService.resolve(b.category) === id);
  }

  // --- Add ----------------------------------------------------------------

  onNewLabelChange(label: string): void {
    this.newLabel = label;
    this.addError = null;
    if (this.idFollowsLabel) this.newId = slugify(label).slice(0, 50);
  }

  onNewIdChange(id: string): void {
    this.newId = id;
    this.addError = null;
    this.idFollowsLabel = id === '';
  }

  async add(): Promise<void> {
    const label = this.newLabel.trim();
    const id = this.newId.trim();
    this.addError = this.labelError(label, null) ?? this.idError(id);
    if (this.addError || this.isSaving) return;

    const order = Math.max(0, ...this.categories.map((c) => c.order)) + 1;
    await this.run(async () => {
      await this.categoryService.save({ id, label, order });
      this.newLabel = '';
      this.newId = '';
      this.idFollowsLabel = true;
      this.message = `Category "${label}" added.`;
    });
  }

  // --- Rename -------------------------------------------------------------

  startEdit(category: Category): void {
    this.editingId = category.id;
    this.editLabel = category.label;
    this.editError = null;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  async saveEdit(category: Category): Promise<void> {
    const label = this.editLabel.trim();
    this.editError = this.labelError(label, category.id);
    if (this.editError || this.isSaving) return;
    if (label === category.label) {
      this.editingId = null;
      return;
    }
    await this.run(async () => {
      await this.categoryService.save({ ...category, label });
      this.editingId = null;
      this.message = `"${category.label}" renamed to "${label}".`;
    });
  }

  // --- Reorder ------------------------------------------------------------

  async move(index: number, delta: -1 | 1): Promise<void> {
    const target = index + delta;
    if (target < 0 || target >= this.categories.length || this.isSaving) return;
    const reordered = [...this.categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.categories = reordered; // move straight away, then save
    await this.run(() => this.categoryService.saveOrder(reordered));
  }

  // --- Delete -------------------------------------------------------------

  askDelete(category: Category): void {
    this.deleting = category;
    this.moveTo = OTHER_CATEGORY.id;
  }

  async confirmDelete(): Promise<void> {
    const category = this.deleting;
    if (!category || this.isSaving) return;
    const books = this.booksIn(category.id);
    await this.run(async () => {
      // Move the books first: if this fails, the category still exists.
      if (books.length > 0) await this.bookService.setCategory(books.map((b) => b.id), this.moveTo);
      await this.categoryService.delete(category.id);
      this.deleting = null;
      const target = this.moveTo === OTHER_CATEGORY.id ? OTHER_CATEGORY.label : this.categoryService.labelOf(this.moveTo);
      this.message = `Category "${category.label}" deleted` + (books.length ? `; ${books.length} book(s) moved to "${target}".` : '.');
    });
  }

  /** Categories the books of the deleted one can move to. */
  get moveTargets(): Category[] {
    return this.categories.filter((c) => c.id !== this.deleting?.id);
  }

  trackById(_: number, category: Category): string {
    return category.id;
  }

  // --- Helpers ------------------------------------------------------------

  private labelError(label: string, ownId: string | null): string | null {
    if (!label) return 'Enter a name.';
    if (label.length > MAX_LABEL_LENGTH) return `The name must be ${MAX_LABEL_LENGTH} characters or fewer.`;
    const lower = label.toLowerCase();
    if (lower === OTHER_CATEGORY.label.toLowerCase()) return '"Other" is reserved for books without a category.';
    if (this.categories.some((c) => c.id !== ownId && c.label.toLowerCase() === lower)) return 'A category already has this name.';
    return null;
  }

  private idError(id: string): string | null {
    if (!id) return 'Enter an id.';
    if (id.length > 50 || !CATEGORY_ID_PATTERN.test(id)) return 'The id may only contain lowercase letters, digits and single dashes.';
    if (id === OTHER_CATEGORY.id || this.categories.some((c) => c.id === id)) return `The id "${id}" is already used.`;
    return null;
  }

  /** Runs a save, shows its error, and reloads the list from Firestore. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isSaving = true;
    this.error = null;
    this.message = null;
    try {
      await action();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      this.error =
        code === 'permission-denied'
          ? 'Refused: your account is not an admin in Firestore (log out and in again after `npm run set-admin`).'
          : 'The change could not be saved. Please try again.';
    } finally {
      this.isSaving = false;
      await this.load();
    }
  }
}
