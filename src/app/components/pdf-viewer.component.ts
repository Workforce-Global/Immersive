import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from '../services/pdf.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-viewer h-full overflow-auto">
      <canvas #pdfCanvas></canvas>
    </div>
  `,
  styles: [`
    .pdf-viewer {
      background-color: #525659;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() pdfData!: ArrayBuffer;
  
  private scale = 1.5;

  constructor(private pdfService: PdfService) {}

  async ngOnInit() {
    try {
      await this.pdfService.loadPdf(this.pdfData);
      await this.renderCurrentPage();

      this.pdfService.currentPage$.subscribe(async pageNumber => {
        await this.renderPage(pageNumber);
      });
    } catch (error) {
      console.error('Error initializing PDF viewer:', error);
    }
  }

  private async renderCurrentPage() {
    const pageNumber = 1;
    await this.renderPage(pageNumber);
  }

  private async renderPage(pageNumber: number) {
    try {
      const page = await this.pdfService.getPage(pageNumber);
      await this.pdfService.renderPage(
        page,
        this.canvas.nativeElement,
        this.scale
      );
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }

  nextPage() {
    const currentPage = (this.pdfService.currentPage$ as any).value;
    if (currentPage < this.pdfService.numPages) {
      this.pdfService.setCurrentPage(currentPage + 1);
    }
  }

  previousPage() {
    const currentPage = (this.pdfService.currentPage$ as any).value;
    if (currentPage > 1) {
      this.pdfService.setCurrentPage(currentPage - 1);
    }
  }
}