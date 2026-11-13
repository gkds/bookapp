import { Component, OnInit } from '@angular/core';
import { RegisterForm } from '../../types/registerForm';
import { AuthService } from '../authService';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  form: RegisterForm = {
    displayName: '',
    email: '',
    password: '',
    confirm_password: '',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.clearError();
  }

  submit(): void {
    this.authService.register(this.form);
  }

  isLoading(): boolean {
    return this.authService.isLoading;
  }

  errorMessage(): string | null {
    return this.authService.errorMessage;
  }
}
