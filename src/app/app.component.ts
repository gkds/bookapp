import { Component } from '@angular/core';
import { AuthService } from './auth/authService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bookApp';
  readonly user$ = this.authService.user$;

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
