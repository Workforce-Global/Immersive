import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';

interface LibrarySettings {
  theme: 'light' | 'dark' | 'sepia';
  sortBy: 'title' | 'author' | 'lastRead';
  viewMode: 'grid' | 'list';
  gridSize: 'small' | 'medium' | 'large';
}

@Component({
    selector: 'app-library-settings-modal',
    imports: [CommonModule, FormsModule, NgIconComponent],
    providers: [provideIcons({ heroXMark })],
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up"
        (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Library Settings</h2>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
            <ng-icon name="heroXMark" class="w-6 h-6"></ng-icon>
          </button>
        </div>
    
        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Theme -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <div class="flex space-x-4">
              @for (theme of themes; track theme) {
                <button
                  (click)="updateSettings({ theme })"
                  [class.ring-2]="settings.theme === theme"
                  [class.ring-blue-500]="settings.theme === theme"
                  class="w-10 h-10 rounded-full focus:outline-none"
                [ngClass]="{
                  'bg-white': theme === 'light',
                  'bg-gray-900': theme === 'dark',
                  'bg-[#f4ecd8]': theme === 'sepia'
                }"
                ></button>
              }
            </div>
          </div>
    
          <!-- Sort By -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort Books By
            </label>
            <select
              [(ngModel)]="settings.sortBy"
              (ngModelChange)="updateSettings({ sortBy: $event })"
              class="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="lastRead">Last Read</option>
            </select>
          </div>
    
          <!-- View Mode -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              View Mode
            </label>
            <div class="flex space-x-4">
              @for (mode of viewModes; track mode) {
                <button
                  (click)="updateSettings({ viewMode: mode })"
                  [class.bg-blue-100]="settings.viewMode === mode"
                  [class.dark:bg-blue-900]="settings.viewMode === mode"
                  class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                  {{ mode | titlecase }}
                </button>
              }
            </div>
          </div>
    
          <!-- Grid Size -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Grid Size
            </label>
            <div class="flex space-x-4">
              @for (size of gridSizes; track size) {
                <button
                  (click)="updateSettings({ gridSize: size })"
                  [class.bg-blue-100]="settings.gridSize === size"
                  [class.dark:bg-blue-900]="settings.gridSize === size"
                  class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                  {{ size | titlecase }}
                </button>
              }
            </div>
          </div>
        </div>
    
        <!-- Footer -->
        <div class="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            (click)="close.emit()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
            Done
          </button>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out;
    }

    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LibrarySettingsModalComponent {
  @Output() close = new EventEmitter<void>();

  settings: LibrarySettings = {
    theme: 'light',
    sortBy: 'lastRead',
    viewMode: 'grid',
    gridSize: 'medium'
  };

  themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
  viewModes: Array<'grid' | 'list'> = ['grid', 'list'];
  gridSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  updateSettings(changes: Partial<LibrarySettings>) {
    this.settings = { ...this.settings, ...changes };
    localStorage.setItem('library-settings', JSON.stringify(this.settings));
  }
}