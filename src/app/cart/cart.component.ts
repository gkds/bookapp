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
  isPlacingOrder = false;
  orderError: string | null = null;

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

  syncError(): string | null {
    return this.cartService.syncError;
  }

  async placeOrder(): Promise<void> {
    if (this.isPlacingOrder) return;

    this.isPlacingOrder = true;
    this.orderError = null;
    try {
      const order = await this.orderService.placeOrder();
      await this.router.navigate(['/order-confirmation', order.id]);
    } catch {
      this.orderError = 'Your order could not be placed. Please try again.';
    } finally {
      this.isPlacingOrder = false;
    }
  }
}
