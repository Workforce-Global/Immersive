import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BookService, Book } from "../../services/book.service";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { invoke } from "@tauri-apps/api/tauri";
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroBookOpen, 
  heroPlus, 
  heroMagnifyingGlass, 
  heroTrash, 
  heroEllipsisVertical,
  heroChevronRight,
  heroCheck,
  heroXMark
} from '@ng-icons/heroicons/outline';

@Component({
  selector: "app-library",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({ 
      heroBookOpen, 
      heroPlus, 
      heroMagnifyingGlass, 
      heroTrash, 
      heroEllipsisVertical,
      heroChevronRight,
      heroCheck,
      heroXMark
    })
  ],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Library</h1>
            <div class="flex items-center space-x-4">
              <button
                (click)="importBook()"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                [class.opacity-50]="multiSelect"
                [disabled]="multiSelect"
              >
                <ng-icon name="heroPlus" class="h-5 w-5 mr-2"></ng-icon>
                Import Book
              </button>
              <button
                (click)="toggleMultiSelect()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                [class.bg-blue-600]="multiSelect"
                [class.text-white]="multiSelect"
                [class.bg-white]="!multiSelect"
                [class.dark:bg-gray-700]="!multiSelect"
                [class.text-gray-700]="!multiSelect"
                [class.dark:text-gray-200]="!multiSelect"
              >
                <ng-icon 
                  [name]="multiSelect ? 'heroXMark' : 'heroCheck'" 
                  class="h-5 w-5 mr-2">
                </ng-icon>
                {{ multiSelect ? "Cancel Selection" : "Select Books" }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Search Bar -->
        <div class="mb-8">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ng-icon 
                name="heroMagnifyingGlass" 
                class="h-5 w-5 text-gray-400">
              </ng-icon>
            </div>
            <input
              type="text"
              placeholder="Search your library..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>

        <!-- Delete Selected Button -->
        <div *ngIf="multiSelect && selectedBooks.size > 0" 
             class="mb-6 flex justify-end">
          <button
            (click)="deleteSelectedBooks()"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ng-icon name="heroTrash" class="h-5 w-5 mr-2"></ng-icon>
            Delete Selected ({{ selectedBooks.size }})
          </button>
        </div>

        <!-- Loading Animation -->
        <div *ngIf="loading" 
             class="flex justify-center items-center my-8">
          <div class="flex space-x-2">
            <div class="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></div>
            <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>

        <!-- Recently Opened Books -->
        <section *ngIf="recentBooks.length > 0" class="mb-12">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recently Opened
            </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div *ngFor="let book of recentBooks"
                 class="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden max-w-[180px]"
                 [class.ring-2]="multiSelect && isSelected(book)"
                 [class.ring-blue-500]="multiSelect && isSelected(book)"
                 (click)="handleBookClick(book)">
              
              <!-- Selection Checkbox -->
              <div *ngIf="multiSelect" 
                   class="absolute top-2 left-2 z-10">
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                     [class.bg-blue-500]="isSelected(book)"
                     [class.border-blue-500]="isSelected(book)"
                     [class.border-gray-300]="!isSelected(book)">
                  <ng-icon
                    *ngIf="isSelected(book)"
                    name="heroCheck"
                    class="h-4 w-4 text-white">
                  </ng-icon>
                </div>
              </div>

              <!-- Book Cover -->
              <div class="aspect-w-2 aspect-h-3 bg-gray-200 dark:bg-gray-700 max-h-[240px]">
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


              <!-- Book Info -->
              <div class="p-4">
                <h3 class="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {{ book.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {{ book.author }}
                </p>
                <div class="mt-2">
                  <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      class="h-full bg-blue-500 rounded-full"
                      [style.width.%]="book.progress * 100"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ (book.progress * 100).toFixed(0) }}% complete
                  </p>
                </div>
              </div>

              <!-- Actions Button -->
              <button
                *ngIf="!multiSelect"
                (click)="showDetails($event, book)"
                class="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ng-icon name="heroEllipsisVertical" class="h-5 w-5"></ng-icon>
              </button>
            </div>
          </div>
        </section>

        <!-- All Books -->
        <section *ngIf="books.length > 0">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Books
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div *ngFor="let book of filteredBooks()"
                 class="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden max-w-[180px]"
                 [class.ring-2]="multiSelect && isSelected(book)"
                 [class.ring-blue-500]="multiSelect && isSelected(book)"
                 (click)="handleBookClick(book)">
              
              <!-- Selection Checkbox -->
              <div *ngIf="multiSelect" 
                   class="absolute top-2 left-2 z-10">
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                     [class.bg-blue-500]="isSelected(book)"
                     [class.border-blue-500]="isSelected(book)"
                     [class.border-gray-300]="!isSelected(book)">
                  <ng-icon
                    *ngIf="isSelected(book)"
                    name="heroCheck"
                    class="h-4 w-4 text-white">
                  </ng-icon>
                </div>
              </div>

              <!-- Book Cover -->
              <div class="aspect-w-2 aspect-h-3 bg-gray-200 dark:bg-gray-700 max-h-[240px]">
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

              <!-- Book Info -->
              <div class="p-4">
                <h3 class="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {{ book.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {{ book.author }}
                </p>
                <div class="mt-2">
                  <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      class="h-full bg-blue-500 rounded-full"
                      [style.width.%]="book.progress * 100"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ (book.progress * 100).toFixed(0) }}% complete
                  </p>
                </div>
              </div>

              <!-- Actions Button -->
              <button
                *ngIf="!multiSelect"
                (click)="showDetails($event, book)"
                class="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ng-icon name="heroEllipsisVertical" class="h-5 w-5"></ng-icon>
              </button>
            </div>
          </div>
        </section>

        <!-- Empty State -->
        <div *ngIf="books.length === 0" 
             class="text-center py-12">
          <ng-icon
            name="heroBookOpen"
            class="mx-auto h-12 w-12 text-gray-400">
          </ng-icon>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No books</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by importing your first book
          </p>
          <div class="mt-6">
            <button
              (click)="importBook()"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ng-icon name="heroPlus" class="h-5 w-5 mr-2"></ng-icon>
              Import Book
            </button>
          </div>
        </div>
      </main>

      <!-- Book Details Modal -->
      <div *ngIf="selectedBook"
           class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden"
             (click)="$event.stopPropagation()">
          <div class="relative">
            <img
              [src]="selectedBook.coverUrl"
              [alt]="selectedBook.title"
              class="w-full h-48 object-cover"
            />
            <button
              (click)="selectedBook = null"
              class="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white hover:bg-gray-900/75"
            >
              <ng-icon name="heroXMark" class="h-5 w-5"></ng-icon>
            </button>
          </div>
          
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ selectedBook.title }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              By {{ selectedBook.author }}
            </p>
            
            <div class="mt-4">
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Reading Progress</span>
                <span>{{ (selectedBook.progress * 100).toFixed(0) }}%</span>
              </div>
              <div class="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  class="h-full bg-blue-500 rounded-full"
                  [style.width.%]="selectedBook.progress * 100"
                ></div>
              </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button
                (click)="selectedBook = null"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              <button
                (click)="deleteBook(selectedBook)"
                class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LibraryComponent implements OnInit {
  books: Book[] = [];
  recentBooks: Book[] = [];
  selectedBook: Book | null = null;
  searchQuery = "";
  multiSelect = false;
  selectedBooks = new Set<string>();
  loading = false;

  constructor(private bookService: BookService, private router: Router) {}

  ngOnInit() {
    this.bookService.books$.subscribe((books) => {
      this.books = books;
      this.updateRecentBooks();
      this.checkStoragePath();
      this.loadAllCovers();
    });
  }

  private updateRecentBooks() {
    // Get the 4 most recently read books
    this.recentBooks = [...this.books]
      .sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime())
      .slice(0, 4);
  }

  private async loadAllCovers() {
    for (const book of this.books) {
      if (!book.coverUrl || !book.coverUrl.startsWith("data:")) {
        try {
          await this.bookService.loadCover(book);
        } catch (error) {
          console.error(`Failed to load cover for book ${book.id}:`, error);
        }
      }
    }
  }

  async checkStoragePath() {
    try {
      const path = await invoke("check_storage_path");
      console.log("Resolved Path:", path);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  filteredBooks() {
    if (!this.searchQuery || this.searchQuery.trim() === "") {
      return this.books;
    }
    return this.books.filter(
      (book) =>
        book.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleMultiSelect() {
    this.multiSelect = !this.multiSelect;
    if (!this.multiSelect) {
      this.selectedBooks.clear();
    }
  }

  isSelected(book: Book): boolean {
    return this.selectedBooks.has(book.id);
  }

  handleBookClick(book: Book) {
    if (this.multiSelect) {
      if (this.selectedBooks.has(book.id)) {
        this.selectedBooks.delete(book.id);
      } else {
        this.selectedBooks.add(book.id);
      }
    } else {
      this.openBook(book.id);
    }
  }

  async deleteSelectedBooks() {
    if (this.selectedBooks.size === 0) return;

    const count = this.selectedBooks.size;
    const delStatus = await confirm(
      `Are you sure you want to delete ${count} selected book${
        count > 1 ? "s" : ""
      }?`
    );
    if (delStatus) {
      for (const bookId of this.selectedBooks) {
        const book = this.books.find((b) => b.id === bookId);
        if (book) {
          await this.bookService.deleteBook(book);
        }
      }
      this.selectedBooks.clear();
      this.multiSelect = false;
    }
  }

  showDetails(event: Event, book: Book) {
    event.stopPropagation();
    this.selectedBook = book;
  }

  async importBook() {
    this.loading = true;
    try {
      const book = await this.bookService.importBook();
      if (book) {
        console.log("Book imported successfully:", book.title);
      }
    } catch (error) {
      console.error("Error importing book:", error);
    } finally {
      this.loading = false;
    }
  }

  async deleteBook(book: Book) {
    const delStatus = await confirm(
      `Are you sure you want to delete "${book.title}"?`
    );
    if (delStatus) {
      await this.bookService.deleteBook(book);
      this.selectedBook = null;
    }
  }

  openBook(bookId: string) {
    if (!this.multiSelect) {
      const book = this.books.find((b) => b.id === bookId);
      this.router.navigate(["/read", bookId], {
        state: {
          bookData: book, // Pass the full book object
          epubPath: book?.path,
        },
      });
    }
  }
}