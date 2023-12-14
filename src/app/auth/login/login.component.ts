import { LoginForm } from './../../types/loginform';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../authService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form : LoginForm = {
    email: '',
    password: ''
  }

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  submit(){
    console.log("== form submitted :", this.form);
    this.authService.login(this.form);
  }
}
