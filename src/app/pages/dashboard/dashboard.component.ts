import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BookService, Book } from "../../services/book.service";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroBookOpen,
  heroChevronRight,
  heroListBullet,
  heroSquares2x2
} from '@ng-icons/heroicons/outline';
import { TitleBarComponent } from "../../components/title-bar.component";

@Component({
    selector: "app-dashboard",
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NgIconComponent,
        TitleBarComponent
    ],
    providers: [
        provideIcons({
            heroBookOpen,
            heroChevronRight,
            heroListBullet,
            heroSquares2x2
        })
    ],
    template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <app-title-bar class="titlebar"></app-title-bar>

      <!-- Current Book Section -->
      <div *ngIf="currentBook" class="relative content-below-titlebar">
        <!-- Background Image (blurred) -->
        <div class="absolute inset-0 overflow-hidden">
          <img
            [src]="currentBook.coverUrl"
            class="w-full h-full object-cover filter blur-xl opacity-30"
            alt=""
          />
        </div>

        <!-- Content -->
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="flex items-start space-x-8">
            <!-- Book Cover -->
            <div class="flex-shrink-0 w-48">
              <img
                [src]="currentBook.coverUrl"
                [alt]="currentBook.title"
                class="w-full rounded-lg shadow-lg"
              />
            </div>

            <!-- Book Info -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ currentBook.title }}
              </h1>
              <p class="mt-2 text-xl text-gray-600 dark:text-gray-300">
                {{ currentBook.author }}
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ currentBook.language || 'EN' }} Edition
              </p>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-300">Progress</span>
                  <span class="text-gray-600 dark:text-gray-300">
                    {{ (currentBook.progress * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    class="h-full bg-blue-500 rounded-full transition-all duration-300"
                    [style.width.%]="currentBook.progress * 100"
                  ></div>
                </div>
              </div>

              <!-- Action Button -->
              <button
                (click)="continueReading(currentBook)"
                class="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue reading
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Books Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Books
          </h2>
          
          <div class="flex items-center space-x-4">
            <!-- Sort Dropdown -->
            <select
              [(ngModel)]="sortBy"
              (change)="sortBooks()"
              class="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            >
              <option value="lastRead">Last Read</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>

            <!-- View Toggle -->
            <div class="flex items-center space-x-2">
              <button
                (click)="viewMode = 'list'"
                [class.text-blue-500]="viewMode === 'list'"
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ng-icon name="heroListBullet" class="w-5 h-5"></ng-icon>
              </button>
              <button
                (click)="viewMode = 'grid'"
                [class.text-blue-500]="viewMode === 'grid'"
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ng-icon name="heroSquares2x2" class="w-5 h-5"></ng-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Grid View -->
        <div *ngIf="viewMode === 'grid'" 
             class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <div *ngFor="let book of recentBooks"
               class="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
               (click)="openBook(book)">
            <div class="aspect-w-2 aspect-h-3 bg-gray-200 dark:bg-gray-700">
              <img
                *ngIf="book.coverUrl"
                [src]="book.coverUrl"
                [alt]="book.title"
                class="object-cover w-full h-full"
              />
              <div
                *ngIf="!book.coverUrl"
                class="flex items-center justify-center h-full"
              >
                <ng-icon
                  name="heroBookOpen"
                  class="h-12 w-12 text-gray-400">
                </ng-icon>
              </div>
            </div>
            <div class="p-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ book.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ book.author }}
              </p>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="viewMode === 'list'" class="space-y-4">
          <div *ngFor="let book of recentBooks"
               class="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
               (click)="openBook(book)">
            <div class="flex-shrink-0 w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <img
                *ngIf="book.coverUrl"
                [src]="book.coverUrl"
                [alt]="book.title"
                class="w-full h-full object-cover"
              />
              <div
                *ngIf="!book.coverUrl"
                class="w-full h-full flex items-center justify-center"
              >
                <ng-icon
                  name="heroBookOpen"
                  class="h-8 w-8 text-gray-400">
                </ng-icon>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ book.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ book.author }}
              </p>
              <div class="mt-2 flex items-center">
                <div class="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    class="h-full bg-blue-500 rounded-full"
                    [style.width.%]="book.progress * 100"
                  ></div>
                </div>
                <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {{ (book.progress * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
            <ng-icon
              name="heroChevronRight"
              class="w-5 h-5 text-gray-400 group-hover:text-gray-600">
            </ng-icon>
          </div>
        </div>

        <!-- View All Books Link -->
        <div class="mt-8 text-center">
          <a
            routerLink="/library"
            class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View all books
            <ng-icon
              name="heroChevronRight"
              class="ml-1 w-5 h-5">
            </ng-icon>
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentBook: Book | null = null;
  recentBooks: Book[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'lastRead' | 'title' | 'author' = 'lastRead';

  constructor(
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit() {
    this.bookService.books$.subscribe(books => {
      if (books.length > 0) {
        // Get the most recently read book for the hero section
        this.currentBook = books[0]; // Books are already sorted by lastRead

        // Get the next 4 most recently read books (excluding current book)
        this.recentBooks = books.slice(1, 5);
      }
    });
  }

  sortBooks() {
    switch (this.sortBy) {
      case 'title':
        this.recentBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        this.recentBooks.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'lastRead':
        this.recentBooks.sort((a, b) => 
          b.lastRead.getTime() - a.lastRead.getTime()
        );
        break;
    }
  }

  continueReading(book: Book) {
    this.router.navigate(['/read', book.id]);
  }

  openBook(book: Book) {
    this.router.navigate(['/read', book.id]);
  }
}