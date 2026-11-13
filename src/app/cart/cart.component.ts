import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem, CartServiceService } from '../cart-service.service';
import { OrderService } from '../order.service';
import { Book } from '../types/book';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  constructor(
    private cartService: CartServiceService,
    private orderService: OrderService,
    private router: Router
  ) {}

  removeFromCart(book: Book): void {
    this.cartService.remove(book);
  }

  getCart(): CartItem[] {
    return this.cartService.get();
  }

  total(): number {
    return this.cartService.total();
  }

  placeOrder(): void {
    if (this.orderService.placeOrder()) {
      this.router.navigate(['/order-confirmation']);
    }
  }
}
