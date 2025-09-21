import { Component, OnInit, ViewChild, ElementRef, Input } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TitleBarComponent } from "../../components/title-bar.component";
import { TocPanelComponent } from "../../components/toc-panel.component";
import { SettingsModalComponent } from "../../components/settings-modal.component";
import { SearchPanelComponent } from "../../components/search-panel.component";
import { LookupPanelComponent } from "../../components/lookup-panel.component";
import { ExcerptPanelComponent } from "../../components/excerpt-panel.component";
import { LoadingScreenComponent } from "../../components/loading-screen.component";
import { ExcerptService } from "../../services/excerpt.service";
import { LookupService } from "../../services/lookup.service";
import { BookService, Book } from "../../services/book.service";
import { SettingsService } from "../../services/settings.service";
import { uint8ArrayToString } from "uint8array-extras";
import ePub from "epubjs";
import { take } from "rxjs";
import { invoke } from "@tauri-apps/api/tauri";
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronLeft, 
  heroChevronRight,
  heroMagnifyingGlass,
  heroCog,
  heroBookOpen,
  heroXMark
} from '@ng-icons/heroicons/outline';
import { PDFDocumentProxy } from 'pdfjs-dist';

@Component({
    selector: "app-reader",
    imports: [
    FormsModule,
    TitleBarComponent,
    TocPanelComponent,
    SettingsModalComponent,
    SearchPanelComponent,
    LookupPanelComponent,
    ExcerptPanelComponent,
    NgIconComponent,
    LoadingScreenComponent
],
    providers: [
        provideIcons({
            heroChevronLeft,
            heroChevronRight,
            heroMagnifyingGlass,
            heroCog,
            heroBookOpen,
            heroXMark
        })
    ],
    template: `
    <div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <!-- Loading Screen -->
      <app-loading-screen
        [show]="loading"
        message="Loading book...">
      </app-loading-screen>
    
      <!-- Title Bar -->
      <app-title-bar></app-title-bar>
    
      <div class="flex flex-1 overflow-hidden">
        <!-- TOC Sidebar -->
        <div
          [class.w-64]="showToc"
          [class.w-0]="!showToc"
          class="transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 dark:border-gray-700"
          >
          <app-toc-panel
            [toc]="tocItems"
            (navigate)="navigateToLocation($event)"
          ></app-toc-panel>
        </div>
    
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Top Bar -->
          <div class="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-4">
              <button
                (click)="showToc = !showToc"
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                <ng-icon
                  name="heroBookOpen"
                  class="w-5 h-5 text-gray-600 dark:text-gray-300">
                </ng-icon>
              </button>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {{ currentBook?.title }}
              </h1>
            </div>
    
            <div class="flex items-center space-x-2">
              <button
                (click)="showSearch = !showSearch"
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                <ng-icon
                  name="heroMagnifyingGlass"
                  class="w-5 h-5 text-gray-600 dark:text-gray-300">
                </ng-icon>
              </button>
              <button
                (click)="showSettings = true"
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                <ng-icon
                  name="heroCog"
                  class="w-5 h-5 text-gray-600 dark:text-gray-300">
                </ng-icon>
              </button>
            </div>
          </div>
    
          <!-- Reader Area -->
          <div class="flex-1 relative overflow-hidden">
            <div
              #readerContainer
              [class.two-page-layout]="isWideScreen && !isSinglePage"
              [class.first-page]="isFirstPage"
              class="absolute inset-0">
            </div>
    
            <!-- Navigation Controls -->
            <div class="absolute inset-y-0 left-0 flex items-center">
              <button
                (click)="prevPage()"
                class="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-r-lg transition-colors"
                >
                <ng-icon name="heroChevronLeft" class="w-6 h-6"></ng-icon>
              </button>
            </div>
            <div class="absolute inset-y-0 right-0 flex items-center">
              <button
                (click)="nextPage()"
                class="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-l-lg transition-colors"
                >
                <ng-icon name="heroChevronRight" class="w-6 h-6"></ng-icon>
              </button>
            </div>
          </div>
    
          <!-- Progress Bar -->
          <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div class="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded">
              <div
                class="absolute h-full bg-blue-500 rounded transition-all duration-300"
                [style.width.%]="(currentBook?.progress || 0) * 100"
              ></div>
            </div>
          </div>
        </div>
    
        <!-- Search Sidebar -->
        <div
          [class.w-80]="showSearch"
          [class.w-0]="!showSearch"
          class="transition-all duration-300 ease-in-out overflow-hidden border-l border-gray-200 dark:border-gray-700"
          >
          <app-search-panel
            [book]="book"
            (navigate)="navigateToLocation($event)"
          ></app-search-panel>
        </div>
      </div>
    
      <!-- Settings Modal -->
      @if (showSettings) {
        <app-settings-modal
          (close)="showSettings = false"
        ></app-settings-modal>
      }
    
      <!-- Floating Panels -->
      <div class="fixed right-8 top-24 space-y-4 z-50">
        @if (showLookup) {
          <div>
            <app-lookup-panel></app-lookup-panel>
          </div>
        }
    
        @if (showExcerpt) {
          <div>
            <app-excerpt-panel
              [bookId]="bookId"
              [text]="selectedText"
              [cfi]="selectedCfi"
              (close)="showExcerpt = false"
            ></app-excerpt-panel>
          </div>
        }
      </div>
    
      <!-- Context Menu -->
      @if (showContextMenu) {
        <div
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
      }
    </div>
    `
})
export class ReaderComponent implements OnInit {
  @ViewChild("readerContainer") readerContainer!: ElementRef;
  @Input() bookId: string = "";
  @Input() parallelMode: boolean = false;

  book: any;
  rendition: any;
  currentBook: Book | null = null;
  tocItems: any[] = [];
  loading = false;
  pdfDocument: PDFDocumentProxy | null = null;
  currentPage = 1;
  zoom = 1.0;

  // UI state
  showToc = false;
  showExcerpt = false;
  showLookup = false;
  showSearch = false;
  showSettings = false;
  showContextMenu = false;

  // Layout state
  isWideScreen = false;
  isSinglePage = false;
  isFirstPage = true;

  // Selection state
  contextMenuX = 0;
  contextMenuY = 0;
  selectedText = "";
  selectedCfi = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private settingsService: SettingsService,
    private excerptService: ExcerptService,
    private lookupService: LookupService
  ) {
    // Check screen size
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    this.isWideScreen = window.innerWidth >= 1024; // lg breakpoint
  }

  async ngOnInit() {
    const navigation = this.router.currentNavigation();
    const state = navigation?.extras.state as {
      bookData: Book;
      epubPath: string;
    };

    if (state?.bookData) {
      this.currentBook = state.bookData;
      await this.loadBook(state.epubPath);
    } else {
      this.route.params.subscribe(async (params) => {
        this.bookId = params["bookId"];
        await this.loadBookFromService();
      });
    }
  }

  private setupCleanup(url: string) {
    // Clean up the Blob URL when the component is destroyed
    this.ngOnDestroy = () => {
      URL.revokeObjectURL(url);
    };
  }

  private async loadBookFromService() {
    const books = await this.bookService.books$.pipe(take(1)).toPromise();
    this.currentBook = books?.find((b) => b.id === this.bookId) || null;

    if (this.currentBook) {
      await this.loadBook(this.currentBook.path);
    }
  }

  async loadBook(path: string) {
    try {
      this.loading = true;
      const bookData = await this.bookService.readBookFile(path);

      if (this.currentBook?.format === 'pdf') {
        await this.loadPdf(bookData);
      } else {
        await this.loadEpub(bookData);
      }
    } catch (error) {
      console.error("Failed to load book:", error);
    } finally {
      this.loading = false;
    }
  }

  private async loadPdf(data: ArrayBuffer) {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    this.pdfDocument = await pdfjsLib.getDocument(data).promise;
    
    // Set up the viewer container
    const container = this.readerContainer.nativeElement;
    container.innerHTML = '';
    container.style.overflow = 'auto';
    container.style.position = 'relative';

    // Load and render the first page
    await this.renderPdfPage(this.currentPage);

    // Set up keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        this.nextPage();
      } else if (e.key === 'ArrowLeft') {
        this.prevPage();
      }
    });
  }

  private async renderPdfPage(pageNumber: number) {
    if (!this.pdfDocument) return;

    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.zoom });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Clear previous content and add the new canvas
    const container = this.readerContainer.nativeElement;
    container.innerHTML = '';
    container.appendChild(canvas);

    // Update progress
    if (this.currentBook) {
      this.currentBook.progress = pageNumber / this.pdfDocument.numPages;
      await this.bookService.updateBookProgress(
        this.currentBook,
        this.currentBook.progress
      );
    }
  }

  async nextPage() {
    if (this.currentBook?.format === 'pdf') {
      if (this.pdfDocument && this.currentPage < this.pdfDocument.numPages) {
        this.currentPage++;
        await this.renderPdfPage(this.currentPage);
      }
    } else {
      this.rendition?.next();
    }
  }

  async prevPage() {
    if (this.currentBook?.format === 'pdf') {
      if (this.pdfDocument && this.currentPage > 1) {
        this.currentPage--;
        await this.renderPdfPage(this.currentPage);
      }
    } else {
      this.rendition?.prev();
    }
  }

  private async loadEpub(data: ArrayBuffer) {
    const blob = new Blob([data], { type: "application/epub+zip" });
    const url = URL.createObjectURL(blob);
    this.book = ePub(url, { openAs: "epub" });
    await this.initializeReader();
    this.setupCleanup(url);
    await this.loadTableOfContents();
  }

  private async initializeReader() {
    this.rendition = this.book.renderTo(this.readerContainer.nativeElement, {
      width: "100%",
      height: "100%",
      spread: this.isWideScreen ? "always" : "none"
    });

    await this.book.ready;
    
    const savedLocation = localStorage.getItem(`book-${this.bookId}-location`);
    if (savedLocation) {
      await this.rendition.display(savedLocation);
    } else {
      await this.rendition.display();
    }

    this.setupEventHandlers();
    this.applyCurrentSettings();
  }

  private async loadTableOfContents() {
    const navigation = await this.book.loaded.navigation;
    const currentLocation = await this.rendition.currentLocation();
    
    this.tocItems = this.processTocItems(navigation.toc, currentLocation?.start?.href);
  }

  private processTocItems(items: any[], currentHref: string, level = 0): any[] {
    return items.map(item => ({
      id: crypto.randomUUID(),
      label: item.label,
      href: item.href,
      level,
      current: item.href === currentHref,
      subitems: item.subitems ? this.processTocItems(item.subitems, currentHref, level + 1) : []
    }));
  }

  private setupEventHandlers() {
    this.rendition.on("relocated", (location: any) => {
      if (this.currentBook) {
        localStorage.setItem(`book-${this.bookId}-location`, location.start.cfi);
        this.currentBook.progress = location.start.percentage;
        this.bookService.saveBookMetadata(this.currentBook);
        
        // Update TOC current item
        this.updateCurrentTocItem(location.start.href);
      }
    });

    this.rendition.on("rendered", () => {
      this.isFirstPage = this.rendition.location.start.percentage === 0;
    });

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

    // Handle click outside context menu
    document.addEventListener("click", () => {
      this.showContextMenu = false;
    });
  }

  private updateCurrentTocItem(href: string) {
    const updateItems = (items: any[]):any => {
      return items.map(item => ({
        ...item,
        current: item.href === href,
        subitems: item.subitems ? updateItems(item.subitems) : []
      }));
    };

    this.tocItems = updateItems(this.tocItems);
  }

  private applyCurrentSettings() {
    this.settingsService.settings$.subscribe(settings => {
      if (this.rendition) {
        this.rendition.themes.fontSize(settings.fontSize + "px");
        this.rendition.themes.font(settings.fontFamily);
        this.applyTheme(settings.theme);

        if (settings.viewMode === "scroll") {
          this.rendition.flow("scrolled");
        } else {
          this.rendition.flow("paginated");
        }

        this.rendition.themes.override("margin", `0 ${settings.margins}px`);
        this.rendition.themes.override("max-width", `${settings.maxWidth}px`);
      }
    });
  }

  private applyTheme(theme: "light" | "dark" | "sepia") {
    const themes = {
      light: {
        body: {
          background: "#ffffff",
          color: "#000000"
        }
      },
      dark: {
        body: {
          background: "#1a1a1a",
          color: "#ffffff"
        }
      },
      sepia: {
        body: {
          background: "#f4ecd8",
          color: "#5f4b32"
        }
      }
    };

    this.rendition.themes.register(theme, themes[theme]);
    this.rendition.themes.select(theme);
  }

  navigateToLocation(target: string) {
    if (target.startsWith("#")) {
      target = target.substring(1);
    }
    this.rendition.display(target);
  }

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

    this.rendition.annotations.highlight(
      this.selectedCfi,
      {},
      (e: Event) => {
        console.log("Highlight clicked:", e);
      }
    );

    this.bookService.addHighlight(
      this.currentBook,
      this.selectedCfi,
      this.selectedText,
      "yellow"
    );
  }

  ngOnDestroy() {
    if (this.book) {
      this.book.destroy();
    }
    window.removeEventListener('resize', () => this.checkScreenSize());
  }
}