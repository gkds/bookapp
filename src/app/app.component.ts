import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { AuthService } from './auth/authService';
import { firebaseConfig } from './firebase.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    initializeApp(firebaseConfig);
  }
  title = 'bookApp';
  currentUser:any;

  isAuthenticated() {
    this.currentUser = this.getCurrentUser();
    return this.authService.isAuthenticated;
  }

  getCurrentUser(){
    return this.authService.getCurrentUser();
  }

  logout() {
    this.authService.logout();
  }

  
}
