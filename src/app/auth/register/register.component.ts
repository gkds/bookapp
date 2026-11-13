import { Component, OnInit } from '@angular/core';
import { RegisterForm } from 'src/app/types/registerForm';
import { AuthService } from '../authService';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  form: RegisterForm = {
    displayName: '',
    email: '',
    password: '',
    confirm_password: '',
  };

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  submit() {
    console.log("register submitted ::!");
    this.authService.register(this.form);
  }

  isLoading() {
     return this.authService.isLoading;
    
  }
}
