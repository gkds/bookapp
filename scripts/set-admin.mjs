// Gives (or removes) the "admin" role to a registered user, as a Firebase
// Auth custom claim. Admins can open the Inventory page and write the catalog.
//
//   npm run set-admin -- someone@example.com            -> real project
//   npm run set-admin -- someone@example.com --revoke   -> removes the role
//   npm run set-admin:emulators -- someone@example.com  -> Auth emulator
//
// Needs the same Google credentials as `npm run seed:books`. The user must
// log out and in again (or wait up to an hour) for the new role to apply.
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'));
const revoke = args.includes('--revoke');
if (args.includes('--emulator')) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}
if (!email) {
  console.error('Usage: npm run set-admin -- <email> [--revoke]');
  process.exit(1);
}

const projectId = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url))).projects.default;
initializeApp({ projectId });
const auth = getAuth();

const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims ?? {}) };
if (revoke) delete claims.admin;
else claims.admin = true;
await auth.setCustomUserClaims(user.uid, claims);

console.log(`${email} is ${revoke ? 'no longer' : 'now'} an admin.`);
