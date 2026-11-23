import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../book.service';
import { CartServiceService } from '../cart-service.service';
import { Book } from '../types/book';
import { CategoryService } from '../category.service';
import { Category, OTHER_CATEGORY } from '../types/category';

export type SortOrder = 'title' | 'price-asc' | 'price-desc' | 'newest';

/** Lowercase, without accents, so "José" matches "jose". */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'bookcatalog',
  templateUrl: './bookcatalog.component.html',
  styleUrls: ['./bookcatalog.component.css'],
})
export class BookcatalogComponent implements OnInit {
  catalog: Book[] = [];
  isLoading = true;
  error: string | null = null;

  // Search form, mirrored in the URL (?q=...&category=...&sort=...).
  query = '';
  category = '';
  sort: SortOrder = 'title';

  results: Book[] = [];
  /** Categories that hold at least one book, with their book count. */
  categoryCounts: { category: Category; count: number }[] = [];

  constructor(
    private bookService: BookService,
    private categoryService: CategoryService,
    private cartService: CartServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.query = params.get('q') ?? '';
      this.category = params.get('category') ?? '';
      const sort = params.get('sort') as SortOrder;
      this.sort = ['title', 'price-asc', 'price-desc', 'newest'].includes(sort) ? sort : 'title';
      this.applyFilters();
    });
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const [books, categories] = await Promise.all([
        this.bookService.getBooks(),
        this.categoryService.getCategories(),
      ]);
      this.catalog = books;
      this.categoryCounts = [...categories, OTHER_CATEGORY]
        .map((category) => ({ category, count: this.catalog.filter((b) => this.categoryOf(b) === category.id).length }))
        .filter((c) => c.count > 0);
      this.applyFilters();
    } catch (error) {
      console.error('Catalog load failed', error);
      this.error = this.describe(error);
    } finally {
      this.isLoading = false;
    }
  }

  /** Submits the search form: the URL changes, which re-applies the filters. */
  search(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query.trim() || null,
        category: this.category || null,
        sort: this.sort === 'title' ? null : this.sort,
      },
    });
  }

  selectCategory(id: string): void {
    this.category = this.category === id ? '' : id;
    this.search();
  }

  reset(): void {
    this.query = '';
    this.category = '';
    this.sort = 'title';
    this.search();
  }

  get hasFilters(): boolean {
    return !!this.query.trim() || !!this.category || this.sort !== 'title';
  }

  addToCart(book: Book): void {
    this.cartService.addToCart(book);
  }

  trackById(_: number, book: Book): string {
    return book.id;
  }

  private applyFilters(): void {
    // Every word must match the title, author or ISBN.
    const words = normalize(this.query).split(/\s+/).filter(Boolean);
    const filtered = this.catalog.filter((book) => {
      if (this.category && this.categoryOf(book) !== this.category) return false;
      const haystack = normalize(`${book.name} ${book.author} ${book.isbn ?? ''}`);
      return words.every((word) => haystack.includes(word));
    });

    const byTitle = (a: Book, b: Book) => a.name.localeCompare(b.name);
    const compare: Record<SortOrder, (a: Book, b: Book) => number> = {
      title: byTitle,
      'price-asc': (a, b) => a.price - b.price || byTitle(a, b),
      'price-desc': (a, b) => b.price - a.price || byTitle(a, b),
      newest: (a, b) => (b.year ?? 0) - (a.year ?? 0) || byTitle(a, b),
    };
    this.results = filtered.sort(compare[this.sort]);
  }

  private categoryOf(book: Book): string {
    return this.categoryService.resolve(book.category);
  }

  private describe(error: unknown): string {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case 'permission-denied':
        return 'The catalog could not be loaded: access refused by the Firestore security rules (deploy them with `npm run deploy:rules`).';
      case 'unavailable':
        return 'The catalog could not be loaded: Firestore is unreachable (check your connection, or start the emulators with `npm run emulators`).';
      default:
        return `The catalog could not be loaded${code ? ` (${code})` : ''}.`;
    }
  }
}
