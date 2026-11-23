import { Component } from '@angular/core';
import { CartItem, CartServiceService } from '../cart-service.service';
import { Book } from '../types/book';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  constructor(private cartService: CartServiceService) {}

  maxQuantity(book: Book): number {
    return CartServiceService.maxQuantity(book);
  }

  increment(book: Book): void {
    this.cartService.addToCart(book);
  }

  decrement(book: Book): void {
    this.cartService.remove(book);
  }

  removeFromCart(book: Book): void {
    this.cartService.removeAll(book);
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
}
