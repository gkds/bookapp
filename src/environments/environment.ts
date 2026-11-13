// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Firebase Web config: these values are public by design (they identify the
  // project, they do not grant access). Protect the project by restricting the
  // API key to your domains (Google Cloud Console > Credentials), enabling
  // App Check, and writing Firebase security rules.
  firebase: {
    apiKey: 'AIzaSyDF8tiOS7wFTNE-dd6fRP0PkPPMgMW0Yss',
    authDomain: 'bookapp-63999.firebaseapp.com',
    projectId: 'bookapp-63999',
    storageBucket: 'bookapp-63999.appspot.com',
    messagingSenderId: '322854553124',
    appId: '1:322854553124:web:463bd8fed9ed3a2c9dfab1',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
