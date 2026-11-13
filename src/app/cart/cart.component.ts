import { Book } from './../types/book';
import { CartServiceService } from './../cart-service.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

 
  constructor(private cartService : CartServiceService ) { }

  ngOnInit(): void {
   
  }

  removeFromCart(book: Book){
    console.log("removing book form Cart....",book)
    this.cartService.remove(book)
  }

  getCart(){
    return this.cartService.get()
  }
}
