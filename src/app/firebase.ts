import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

// Single Firebase initialisation, done once when the module is first imported,
// so the auth instance is ready before any service or guard uses it.
export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
