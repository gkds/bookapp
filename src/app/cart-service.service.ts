import { Book } from './types/book';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {

  cartList: Array<Book> = new Array()

  constructor() { }

  addToCart(b:Book){
    this.cartList.push(b)
  }

  get(): Book[]{
    return this.cartList
  }

  remove(book: Book){
    console.log("in service remove() book:",book)
    this.cartList = this.cartList.filter(b => b !== book)
    console.log(this.cartList)
  }
}
