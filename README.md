# bookapp

book e-commerce site angular 14

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Firebase (Auth + Firestore)

The app uses Firebase Authentication and Cloud Firestore:

- `categories/{categoryId}`: the book categories (`label`, `order`), public; managed by admins on `/admin/categories`. The default list lives in `data/categories.json`.
- `books/{bookId}`: the catalog, public and read-only from the app. Its content lives in `data/books.json` and is loaded with a script (below).
- `carts/{uid}`: the logged-in user's cart (items added before login are merged into it).
- `orders/{orderId}`: placed orders, readable only by their owner and never editable from the client.

Access rules live in `firestore.rules`.

**First-time setup of the Firebase project**

1. In the Firebase console, create the Firestore database (Build > Firestore Database).
2. Deploy the security rules: `npx firebase login`, then `npm run deploy:rules`.
3. Load the categories and the catalog: `gcloud auth application-default login` (or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account key), then `npm run seed:books`.
   Edit `data/books.json` / `data/categories.json` and re-run the command to add or update books; it never creates duplicates.
   Note: re-running it resets the label and order of the categories listed in `data/categories.json` (changes made on `/admin/categories` to those ids are overwritten).
4. Optionally load the extra inventory (25 literature, philosophy and cooking books, with stock): `npm run seed:inventory`.

**Local development with the emulators** (no real data touched; needs Java)

```bash
npm run emulators         # Auth on :9099, Firestore on :8080, UI on :4000
npm run seed:emulators    # load data/books.json into the emulator (each time the emulators restart)
npm run seed:inventory:emulators   # optional: also load data/inventory.json
npm run start:emulators   # app on http://localhost:4200 wired to the emulators
```

## Features

### Categories and search
Categories are stored in the Firestore `categories` collection; each book holds a category id in `category`.
The default list (`data/categories.json`, loaded by `npm run seed:books`) is:
Software Craftsmanship, Architecture & Design, Programming Languages, Software Testing & QA,
Algorithms & Computer Science, Web Development, Data Science & AI, DevOps & Cloud,
Project Management & Agile, Manga & Comics. Books with no (or a deleted) category are shown under the built-in "Other".

Admins manage them on `/admin/categories`: add (the id is generated from the name and cannot change later),
rename, reorder (the home page uses this order), and delete — the books of a deleted category are moved to
the category of your choice first.

The home page has a search form (title, author or ISBN), a category filter, a sort order and
category chips. The search lives in the URL (`/?q=martin&category=testing-qa&sort=price-asc`),
so results can be bookmarked and shared.

### Inventory (admin)
`/admin/inventory` lists the catalog with its stock and imports books from a CSV file
(comma or semicolon separated; a preview shows new books, updates and invalid lines before anything is saved).
Columns: `id, name, author, price, category, stock, image, isbn, year` — see `data/inventory-sample.csv`
or the "CSV template" button. A line whose `id` already exists updates that book.

Admins are users with the `admin` custom claim. Give the role with:

```bash
npm run set-admin -- someone@example.com     # --revoke to remove it
```

(`npm run set-admin:emulators -- ...` for the emulators.) The user must log out and in again to get the role.
The Firestore rules only let admins write the `books` collection.

### Checkout and (fake) payment
Cart → Delivery (address, standard or express shipping) → Payment (card form) → Confirmation.
The payment is **simulated** (`src/app/checkout/payment.service.ts`): no money moves, card details never
leave the browser and only the brand, last 4 digits and a transaction id are saved on the order.
The form checks the card number (Luhn), expiry date and CVC. Test cards:

| Card number | Result |
| --- | --- |
| 4242 4242 4242 4242 | Accepted |
| 5555 5555 5555 4444 | Accepted (Mastercard) |
| 3782 822463 10005 | Accepted (American Express) |
| 4000 0027 6000 3184 | 3-D Secure screen, code `123456` |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVC |

Use any future expiry date. To plug in a real provider (Stripe, Adyen...), replace `PaymentService`
with one that calls your backend; card data must then go through the provider's hosted fields.

## Deploy to Firebase Hosting

```bash
npx firebase login   # once per machine
npm run deploy       # production build + Hosting + Firestore rules
```

The site is then served at https://bookapp-63999.web.app (and https://bookapp-63999.firebaseapp.com).
Load or update the catalog separately with `npm run seed:books` (see above).

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
