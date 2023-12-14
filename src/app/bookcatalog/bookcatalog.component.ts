import { CartServiceService } from './../cart-service.service';
import { Book } from './../types/book';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'bookcatalog',
  templateUrl: './bookcatalog.component.html',
  styleUrls: ['./bookcatalog.component.css']
})
export class BookcatalogComponent implements OnInit {

  catalog: Book[] = [
  {
    name: "Clean code",
    author: "Robert C. Martin",
    image : "https://images2.medimops.eu/product/e5315c/M00132350882-large.jpg",
    price: 50
  },
  {
    name: "ISTQB Foundation Sample Exam Questions Certified Tester Foundation Level (CTFL) 2018 Syllabus",
    author:  "Chavi Raj Dosaj",
    image: "https://libris.to/media/jacket/26116152t.jpg" ,
    price: 25 
  },
  {
    name: "Test Automation Fundamentals",
    author: "Thomas Steirer",
    image: "https://libris.to/media/jacket/38923017t.jpg",
    price: 48.5
  },
  {
    name: 'GoodNight Punpun, Vol 3',
    author: 'Inio Asano',
    image: "https://libris.to/media/jacket/10044978t.jpg",
    price: 23.62
  }
]

isShowing = false;
myInput:string = null

handleInput(event:any) {
  this.myInput = event.target.value
}

addToCart(event:Book){
  console.log(event)
  this.cartService.addToCart(event)
}

constructor(private cartService: CartServiceService) { }

ngOnInit(): void {
  }

}
