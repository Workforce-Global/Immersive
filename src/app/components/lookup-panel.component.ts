import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LookupService, LookupResult } from '../services/lookup.service';

@Component({
    selector: 'app-lookup-panel',
    imports: [CommonModule],
    template: `
    <div *ngIf="result" 
         class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold">{{ result.word }}</h3>
        <button
          (click)="close()"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>

      <div *ngIf="result.loading" class="text-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
      </div>

      <div *ngIf="!result.loading">
        <div *ngIf="result.error" class="text-red-500 dark:text-red-400">
          {{ result.error }}
        </div>

        <div *ngIf="result.definition" class="space-y-2">
          <div *ngFor="let def of result.definition.split('\n')"
               class="text-sm">
            {{ def }}
          </div>
        </div>

        <div *ngIf="result.summary" class="space-y-4">
          <p class="text-sm">{{ result.summary }}</p>
          <a *ngIf="result.url"
             [href]="result.url"
             target="_blank"
             class="text-blue-500 hover:text-blue-600 text-sm inline-block">
            Read more on Wikipedia
          </a>
        </div>
      </div>
    </div>
  `
})
export class LookupPanelComponent {
  result: LookupResult | null = null;

  constructor(private lookupService: LookupService) {
    this.lookupService.result$.subscribe(result => {
      this.result = result;
    });
  }

  close() {
    this.lookupService.clearLookup();
  }
}