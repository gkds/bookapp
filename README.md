# bookapp

book e-commerce site angular 14

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Firebase (Auth + Firestore)

The app uses Firebase Authentication and Cloud Firestore:

- `carts/{uid}`: the logged-in user's cart (items added before login are merged into it).
- `orders/{orderId}`: placed orders, readable only by their owner and never editable from the client.

Access rules live in `firestore.rules`.

**First-time setup of the Firebase project**

1. In the Firebase console, create the Firestore database (Build > Firestore Database).
2. Deploy the security rules: `npx firebase login`, then `npm run deploy:rules`.

**Local development with the emulators** (no real data touched; needs Java)

```bash
npm run emulators         # Auth on :9099, Firestore on :8080, UI on :4000
npm run start:emulators   # app on http://localhost:4200 wired to the emulators
```

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
