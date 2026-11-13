import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { auth } from '../firebase';
import { LoginForm } from '../types/loginform';
import { RegisterForm } from '../types/registerForm';

const MIN_PASSWORD_LENGTH = 6;

/** Maps Firebase Auth error codes to messages that can be shown to the user. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/weak-password': `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Current Firebase user. It emits once Firebase has restored (or not) the
   * persisted session, so subscribers never see a premature "logged out"
   * state after a page reload.
   */
  private readonly userSubject = new ReplaySubject<User | null>(1);
  readonly user$: Observable<User | null> = this.userSubject.asObservable();
  readonly isAuthenticated$: Observable<boolean> = this.user$.pipe(map((user) => !!user));

  isLoading = false;
  errorMessage: string | null = null;

  constructor(private router: Router, private zone: NgZone) {
    onAuthStateChanged(auth, (user) => this.zone.run(() => this.userSubject.next(user)));
  }

  async login(form: LoginForm): Promise<void> {
    if (this.isLoading) return;

    this.errorMessage = null;
    this.isLoading = true;
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      await this.router.navigate(['']);
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  async register(form: RegisterForm): Promise<void> {
    if (this.isLoading) return;

    // Validate before touching isLoading, so a validation error can never
    // leave the form stuck in the "Loading..." state.
    this.errorMessage = null;
    if (form.password !== form.confirm_password) {
      this.errorMessage = 'The passwords do not match.';
      return;
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      this.errorMessage = AUTH_ERROR_MESSAGES['auth/weak-password'];
      return;
    }

    this.isLoading = true;
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // Only send the display name: the form also holds the passwords.
      await updateProfile(user, { displayName: form.displayName });
      // onAuthStateChanged fired before the profile update; publish the
      // updated user so the display name shows up straight away.
      this.zone.run(() => this.userSubject.next(auth.currentUser));
      await this.router.navigate(['']);
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await this.router.navigate(['login']);
    } catch (error) {
      this.errorMessage = this.toMessage(error);
    }
  }

  /** Clears a previous error, e.g. when the user opens another auth page. */
  clearError(): void {
    this.errorMessage = null;
  }

  private toMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    return (code && AUTH_ERROR_MESSAGES[code]) || 'Something went wrong. Please try again.';
  }
}
