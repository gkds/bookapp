import { Component, OnInit } from '@angular/core';
import { LoginForm } from '../../types/loginform';
import { AuthService } from '../authService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form: LoginForm = {
    email: '',
    password: '',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.clearError();
  }

  submit(): void {
    this.authService.login(this.form);
  }

  isLoading(): boolean {
    return this.authService.isLoading;
  }

  errorMessage(): string | null {
    return this.authService.errorMessage;
  }
}
