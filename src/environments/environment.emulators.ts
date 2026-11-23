// Development build wired to the local Firebase emulators: `npm run start:emulators`.

export const environment = {
  production: false,
  useEmulators: true,
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

