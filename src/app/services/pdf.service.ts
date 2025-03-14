import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { BehaviorSubject } from 'rxjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfPage {
  pageNumber: number;
  text: string;
  viewport: any;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private pdf: any;
  private currentPage = new BehaviorSubject<number>(1);
  currentPage$ = this.currentPage.asObservable();

  async loadPdf(data: ArrayBuffer) {
    try {
      this.pdf = await pdfjsLib.getDocument(data).promise;
      return this.pdf;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  async getPage(pageNumber: number): Promise<PdfPage> {
    try {
      const page = await this.pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');

      return {
        pageNumber,
        text,
        viewport
      };
    } catch (error) {
      console.error(`Error getting page ${pageNumber}:`, error);
      throw error;
    }
  }

  async renderPage(page: any, canvas: HTMLCanvasElement, scale = 1) {
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport
    }).promise;
  }

  async searchText(query: string): Promise<any[]> {
    const results = [];
    const numPages = this.pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await this.getPage(pageNum);
      if (page.text.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          pageNumber: pageNum,
          text: this.extractSnippet(page.text, query)
        });
      }
    }

    return results;
  }

  private extractSnippet(text: string, query: string, contextLength = 50): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    return text.slice(start, end);
  }

  setCurrentPage(pageNumber: number) {
    this.currentPage.next(pageNumber);
  }

  get numPages(): number {
    return this.pdf?.numPages || 0;
  }
}