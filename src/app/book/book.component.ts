import { Book } from './../types/book';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';;


@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {

  @Input() book : Book = {} as Book
  @Output() bookEmitter = new EventEmitter<Book>()

  constructor() { }

  ngOnInit(): void {
    
  }

  addToCart(){
   // console.log('this book is '+JSON.stringify(this.book))
   this.bookEmitter.emit(this.book)
  }

}
