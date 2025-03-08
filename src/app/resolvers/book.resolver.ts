import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Observable, map, filter, take, catchError, throwError } from "rxjs";
import { BookService, Book } from "../services/book.service";

@Injectable({ providedIn: "root" })
export class BookResolver implements Resolve<Book> {
  constructor(private bookService: BookService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Book> {
    const bookId = route.paramMap.get("bookId");
    return this.bookService.books$.pipe(
      map((books) => books.find((b) => b.id === bookId)),
      filter((book) => !!book),
      take(1),
      catchError((error) => {
        console.error("Resolver error:", error);
        return throwError(() => new Error("Book not found"));
      })
    );
  }
}
