import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcerptService, Excerpt } from '../services/excerpt.service';

@Component({
    selector: 'app-excerpt-panel',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold">Save Excerpt</h3>
        <button
          (click)="close()"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>

      <div class="mb-4">
        <div class="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2">
          {{ text }}
        </div>
        <textarea
          [(ngModel)]="note"
          placeholder="Add a note (optional)"
          class="w-full p-2 rounded border dark:bg-gray-700 dark:text-white text-sm"
          rows="3"
        ></textarea>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          (click)="close()"
          class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          (click)="saveExcerpt()"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Excerpt
        </button>
      </div>
    </div>
  `
})
export class ExcerptPanelComponent {
  @Input() bookId!: string;
  @Input() text!: string;
  @Input() cfi!: string;
  note = '';

  constructor(private excerptService: ExcerptService) {}

  saveExcerpt() {
    this.excerptService.addExcerpt(
      this.bookId,
      this.text,
      this.cfi,
      this.note
    );
    this.close();
  }

  close() {
    // Event will be handled by parent
    this.note = '';
  }
}