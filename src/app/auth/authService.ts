import { Injectable } from '@angular/core';
import { RegisterForm } from '../types/registerForm';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { Router } from '@angular/router';
import { LoginForm } from '../types/loginform';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor(private router: Router) {}

  isLoading: boolean = false;

  login(form: LoginForm) {
    if (this.isLoading) return;

    this.isLoading = true;

    const auth = getAuth();
    signInWithEmailAndPassword(auth, form.email, form.password)
      .then((userCredential) => {
        this.isAuthenticated = true;
        console.log("User credentials:",userCredential);
        this.router.navigate(['']);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        this.isAuthenticated = false;
      })
      .finally(() => (this.isLoading = false));
  }

  isAuthenticated: boolean = false;

  passwordMatched: boolean = true;

  register(form: RegisterForm) {
    if (this.isLoading) return;

    this.isLoading = true;

    if (form.password !== form.confirm_password) {
      this.passwordMatched = false;
      console.log("password is not identic:!!!");
      return;
    }

    const auth = getAuth();
    createUserWithEmailAndPassword(auth, form.email, form.password)
      .then((userCredential) => {
        this.isAuthenticated = true;
        updateProfile(userCredential.user, form);
      })
      .catch((error) => {
        this.isAuthenticated = false;
        const errorCode = error.code;
        const errorMessage = error.message;
      })
      .finally(() => 
      { 
        this.isLoading = false});
  }

  getCurrentUser(){
    return getAuth().currentUser;
  }

  logout() {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        this.router.navigate(['login']);
        this.isAuthenticated = false;
      })
      .catch((error) => {
        // An error happened.
      });
  }
  
}


