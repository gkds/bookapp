import { Component } from '@angular/core';
import { AuthService } from './auth/authService';
import { CartServiceService } from './cart-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'bookApp';
  readonly user$ = this.authService.user$;
  readonly isAdmin$ = this.authService.isAdmin$;

  constructor(private authService: AuthService, private cartService: CartServiceService) {}

  /** Number of books in the cart, shown next to "My Cart". */
  cartCount(): number {
    return this.cartService.get().reduce((n, item) => n + item.quantity, 0);
  }

  logout(): void {
    this.authService.logout();
  }
}
