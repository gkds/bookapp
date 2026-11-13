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

  /** Set when the cover cannot be loaded, to show a placeholder instead. */
  imageFailed = false

  constructor() { }

  ngOnInit(): void {
    
  }

  addToCart(){
   this.bookEmitter.emit(this.book)
  }

}
