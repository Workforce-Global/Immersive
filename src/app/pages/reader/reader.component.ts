import { Component, OnInit, ViewChild, ElementRef, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { SettingsPanelComponent } from "../../components/settings-panel.component";
import { SearchPanelComponent } from "../../components/search-panel.component";
import { LookupPanelComponent } from "../../components/lookup-panel.component";
import { ExcerptPanelComponent } from "../../components/excerpt-panel.component";
import { ExcerptService } from "../../services/excerpt.service";
import { LookupService } from "../../services/lookup.service";
import { BookService, Book } from "../../services/book.service";
import { SettingsService } from "../../services/settings.service";
import { uint8ArrayToString } from "uint8array-extras";
import ePub from "epubjs";
import { take } from "rxjs";
import { invoke } from "@tauri-apps/api/tauri";

@Component({
  selector: "app-reader",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SettingsPanelComponent,
    SearchPanelComponent,
    LookupPanelComponent,
    ExcerptPanelComponent,
  ],
  template: `
    <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
      <!-- Left Sidebar -->
      <div
        [class.w-64]="showToc"
        [class.w-0]="!showToc"
        class="transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-4">Table of Contents</h3>
          <div class="toc-content"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <!-- Top Bar -->
        <div
          class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
        >
          <div class="flex items-center space-x-4">
            <button
              (click)="showToc = !showToc"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ☰
            </button>
            <h1 class="text-lg font-semibold">{{ currentBook?.title }}</h1>
          </div>

          <div class="flex items-center space-x-4">
            <button
              (click)="showSearch = !showSearch"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              🔍
            </button>
            <button
              (click)="showSettings = !showSettings"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ⚙️
            </button>
          </div>
        </div>

        <!-- Reader Area -->
        <div class="flex-1 flex">
          <div class="flex-1 relative">
            <div #readerContainer class="absolute inset-0"></div>

            <div
              *ngIf="loadError"
              class="absolute inset-0 bg-red-100 dark:bg-red-900 p-4 z-50"
            >
              <h2 class="text-xl font-bold mb-2">Error Loading Book</h2>
              <p>{{ errorMessage }}</p>
              <button
                (click)="retryLoad()"
                class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Retry
              </button>
            </div>

            <!-- Navigation Controls -->
            <div class="absolute inset-y-0 left-0 flex items-center">
              <button
                (click)="prev()"
                class="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-r-lg"
              >
                ←
              </button>
            </div>
            <div class="absolute inset-y-0 right-0 flex items-center">
              <button
                (click)="next()"
                class="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-l-lg"
              >
                →
              </button>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div
            [class.w-80]="showSearch || showSettings"
            [class.w-0]="!showSearch && !showSettings"
            class="transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div *ngIf="showSearch">
              <app-search-panel
                [book]="book"
                (navigate)="navigateToLocation($event)"
              ></app-search-panel>
            </div>
            <div *ngIf="showSettings">
              <app-settings-panel></app-settings-panel>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4"
        >
          <div class="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded">
            <div
              class="absolute h-full bg-blue-500 rounded"
              [style.width.%]="(currentBook?.progress || 0) * 100"
            ></div>
          </div>
        </div>
      </div>

      <!-- Floating Panels -->
      <div class="fixed right-8 top-24 space-y-4 z-50">
        <div *ngIf="showLookup">
          <app-lookup-panel></app-lookup-panel>
        </div>

        <div *ngIf="showExcerpt">
          <app-excerpt-panel
            [bookId]="bookId"
            [text]="selectedText"
            [cfi]="selectedCfi"
            (close)="showExcerpt = false"
          ></app-excerpt-panel>
        </div>
      </div>

      <!-- Context Menu -->
      <div
        *ngIf="showContextMenu"
        [style.top.px]="contextMenuY"
        [style.left.px]="contextMenuX"
        class="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[160px] z-50"
      >
        <button
          (click)="lookupSelection()"
          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Look Up
        </button>
        <button
          (click)="excerptSelection()"
          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Save Excerpt
        </button>
        <button
          (click)="highlightSelection()"
          class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Highlight
        </button>
      </div>
    </div>
  `,
})
export class ReaderComponent implements OnInit {
  @ViewChild("readerContainer") readerContainer!: ElementRef;
  @Input() bookId: string = "";
  @Input() parallelMode: boolean = false;

  book: any;
  rendition: any;
  currentBook: Book | null = null;

  // UI state
  showToc = false;
  showExcerpt = false;
  showLookup = false;
  showSearch = false;
  showSettings = false;
  showContextMenu = false;

  // Selection state
  contextMenuX = 0;
  contextMenuY = 0;
  selectedText = "";
  selectedCfi = "";

  loadError = false;
  errorMessage = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private settingsService: SettingsService,
    private excerptService: ExcerptService,
    private lookupService: LookupService
  ) {}

  async ngOnInit() {
    // First check for state data
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      bookData: Book;
      epubPath: string;
    };

    if (state?.bookData) {
      // Use immediately available data
      this.currentBook = state.bookData;
      await this.loadBook(state.epubPath);
    } else {
      // Fallback to service lookup
      this.route.params.subscribe(async (params) => {
        this.bookId = params["bookId"];
        await this.loadBookFromService();
      });
    }
  }

  private async loadBookFromService() {
    const books = await this.bookService.books$.pipe(take(1)).toPromise();
    this.currentBook = books?.find((b) => b.id === this.bookId) || null;

    if (!this.currentBook) {
      console.error("Book not found in service");
      this.loadError = true;
      this.errorMessage = "Book not found in library";
      return; // Remove checkAlternativeSources call
    }

    await this.loadBook(this.currentBook.path);
  }

  private async loadBook(epubPath: string) {
    try {
      // Verify path exists first
      const pathValid = await invoke("check_storage_path");
      console.log("Storage path validity:", pathValid);

      // Direct file access
      const bookData = await this.bookService.readBookFile(epubPath);

      // Create Blob URL with proper cleanup
      const blob = new Blob([bookData], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);

      this.book = ePub(url, {
        openAs: "epub",
      });

      // Initialize rendition and cleanup
      this.initializeReader();
      this.setupCleanup(url);
    } catch (error) {
      console.error("Critical load error:", error);
      this.handleLoadError(error);
    }
  }

  private handleLoadError(error: any) {
    this.loadError = true;
    this.errorMessage = this.parseError(error);
    console.error("Reader load failed:", error);
  }

  private parseError(error: any): string {
    if (error.message?.includes("File does not exist")) {
      return "The book file appears to be missing from storage.";
    }
    if (error.message?.includes("Invalid EPUB")) {
      return "The book file is corrupted or invalid.";
    }
    return "Unknown error occurred while loading the book.";
  }

  // Add these methods to the component class
  private initializeReader() {
    this.rendition = this.book.renderTo(this.readerContainer.nativeElement, {
      width: "100%",
      height: "100%",
      spread: "none",
    });

    this.book.ready.then(async () => {
      const toc = await this.book.loaded.navigation;
      this.renderTableOfContents(toc.toc);

      // Load last position
      const savedLocation = localStorage.getItem(
        `book-${this.bookId}-location`
      );
      savedLocation
        ? this.rendition.display(savedLocation)
        : this.rendition.display();
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Selection handling
    this.rendition.on("selected", (cfiRange: string, contents: any) => {
      const selection = contents.window.getSelection();
      const text = selection.toString().trim();

      if (text) {
        this.selectedText = text;
        this.selectedCfi = cfiRange;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        this.contextMenuX = rect.right;
        this.contextMenuY = rect.bottom;
        this.showContextMenu = true;
      }
    });

    // Location tracking
    this.rendition.on("relocated", (location: any) => {
      if (this.currentBook) {
        localStorage.setItem(
          `book-${this.bookId}-location`,
          location.start.cfi
        );
        this.currentBook.progress = location.start.percentage;
        this.bookService.saveBookMetadata(this.currentBook);
      }
    });
  }

  private async checkAlternativeSources() {
    // Implement fallback loading logic here
    console.warn("Implement alternative book loading source");
    this.loadError = true;
    this.errorMessage = "Book not found in any available sources";
  }

  async retryLoad() {
    this.loadError = false;
    if (this.currentBook) {
      await this.loadBook(this.currentBook.path);
    }
  }

  private setupCleanup(url: string) {
    this.rendition.on("relocated", () => {
      URL.revokeObjectURL(url);
    });

    // Apply settings changes
    this.settingsService.settings$.subscribe((settings) => {
      if (this.rendition) {
        this.rendition.themes.fontSize(settings.fontSize + "px");
        this.rendition.themes.font(settings.fontFamily);
        this.applyTheme(settings.theme);

        // Handle view mode change
        if (settings.viewMode === "scroll") {
          this.rendition.flow("scrolled");
        } else {
          this.rendition.flow("paginated");
        }

        // Apply margins and max width
        this.rendition.themes.override("margin", `0 ${settings.margins}px`);
        this.rendition.themes.override("max-width", `${settings.maxWidth}px`);
      }
    });

    // Handle click outside context menu
    document.addEventListener("click", (e) => {
      if (this.showContextMenu) {
        this.showContextMenu = false;
      }
    });
  }

  // async loadBook() {
  //   try {
  //     // Get book from service
  //     const books = await this.bookService.books$.toPromise();
  //     this.currentBook = books
  //       ? books.find((b) => b.id === this.bookId) || null
  //       : null;

  //     if (!this.currentBook) {
  //       console.error("Book not found:", this.bookId);
  //       return;
  //     }

  //     // Load book data
  //     const bookData = await this.bookService.readBookFile(
  //       this.currentBook.path
  //     );
  //     console.log("EPUB Data Size:", bookData.byteLength);

  //     // Create disposable Blob URL
  //     const blob = new Blob([bookData], { type: "application/epub+zip" });
  //     const url = URL.createObjectURL(blob);

  //     // Initialize EPUB with proper options
  //     this.book = ePub(url, {
  //       openAs: "epub",
  //     });

  //     // Add cleanup in ngOnDestroy
  //     this.rendition.on("destroyed", () => {
  //       URL.revokeObjectURL(url);
  //     });

  //     // Initialize rendition
  //     this.rendition = this.book.renderTo(this.readerContainer.nativeElement, {
  //       width: "100%",
  //       height: "100%",
  //       spread: "none",
  //     });

  //     // Load table of contents
  //     const toc = await this.book.loaded.navigation;
  //     this.renderTableOfContents(toc.toc);

  //     // Load last position
  //     const savedLocation = localStorage.getItem(
  //       `book-${this.bookId}-location`
  //     );
  //     if (savedLocation) {
  //       this.rendition.display(savedLocation);
  //     } else {
  //       this.rendition.display();
  //     }

  //     // Set up selection handling
  //     this.rendition.on("selected", (cfiRange: string, contents: any) => {
  //       const selection = contents.window.getSelection();
  //       const text = selection.toString().trim();

  //       if (text) {
  //         this.selectedText = text;
  //         this.selectedCfi = cfiRange;

  //         // Show context menu at mouse position
  //         const range = selection.getRangeAt(0);
  //         const rect = range.getBoundingClientRect();
  //         this.contextMenuX = rect.right;
  //         this.contextMenuY = rect.bottom;
  //         this.showContextMenu = true;
  //       }
  //     });

  //     // Save location on page change
  //     this.rendition.on("relocated", (location: any) => {
  //       if (this.currentBook) {
  //         localStorage.setItem(
  //           `book-${this.bookId}-location`,
  //           location.start.cfi
  //         );
  //         this.currentBook.progress = location.start.percentage;
  //         this.bookService.saveBookMetadata(this.currentBook);
  //       }
  //     });

  //     // Load existing highlights
  //     if (this.currentBook.highlights) {
  //       this.currentBook.highlights.forEach((highlight) => {
  //         this.rendition.annotations.highlight(
  //           highlight.cfi,
  //           {},
  //           (e: Event) => {
  //             console.log("Highlight clicked:", e);
  //           }
  //         );
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Failed to load book:", error);
  //   }
  // }

  renderTableOfContents(toc: any[]) {
    const tocElement =
      this.readerContainer.nativeElement.querySelector(".toc-content");
    if (!tocElement) return;

    const createTocItem = (item: any) => {
      const div = document.createElement("div");
      div.className =
        "py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
      div.textContent = item.label;
      div.onclick = () => this.navigateToLocation(item.href);
      return div;
    };

    const renderItems = (items: any[]) => {
      items.forEach((item) => {
        tocElement.appendChild(createTocItem(item));
        if (item.subitems?.length) {
          const subContainer = document.createElement("div");
          subContainer.className = "ml-4";
          item.subitems.forEach((subitem: any) => {
            subContainer.appendChild(createTocItem(subitem));
          });
          tocElement.appendChild(subContainer);
        }
      });
    };

    renderItems(toc);
  }

  // Navigation
  next() {
    this.rendition.next();
  }

  prev() {
    this.rendition.prev();
  }

  navigateToLocation(target: string) {
    if (target.startsWith("#")) {
      target = target.substring(1);
    }
    this.rendition.display(target);
  }

  // Context menu actions
  lookupSelection() {
    this.showContextMenu = false;
    this.showLookup = true;
    this.lookupService.lookupWord(this.selectedText);
  }

  excerptSelection() {
    this.showContextMenu = false;
    this.showExcerpt = true;
  }

  highlightSelection() {
    this.showContextMenu = false;

    if (!this.currentBook) return;

    // Add highlight to the book
    this.rendition.annotations.highlight(this.selectedCfi, {}, (e: Event) => {
      console.log("Highlight clicked:", e);
    });

    // Save highlight
    this.bookService.addHighlight(
      this.currentBook,
      this.selectedCfi,
      this.selectedText,
      "yellow"
    );
  }

  private applyTheme(theme: "light" | "dark" | "sepia") {
    const themes = {
      light: {
        body: {
          background: "#ffffff",
          color: "#000000",
        },
      },
      dark: {
        body: {
          background: "#1a1a1a",
          color: "#ffffff",
        },
      },
      sepia: {
        body: {
          background: "#f4ecd8",
          color: "#5f4b32",
        },
      },
    };

    this.rendition.themes.register(theme, themes[theme]);
    this.rendition.themes.select(theme);
  }
  ngOnDestroy() {
    if (this.book) {
      this.book.destroy();
    }
  }
}
