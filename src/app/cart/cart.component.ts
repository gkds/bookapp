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

  removeFromCart(book: Book): void {
    this.cartService.remove(book);
  }

  getCart(): CartItem[] {
    return this.cartService.get();
  }

  total(): number {
    return this.cartService.total();
  }
}
