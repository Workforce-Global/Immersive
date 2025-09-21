import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ReaderSettings } from '../services/settings.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'app-settings-modal',
    imports: [CommonModule, FormsModule, NgIconComponent],
    providers: [provideIcons({ heroXMark })],
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Reader Settings</h2>
          <button
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <ng-icon name="heroXMark" class="w-6 h-6"></ng-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Font Size -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Size
            </label>
            <div class="flex items-center space-x-4">
              <button
                (click)="updateFontSize(-1)"
                class="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                A-
              </button>
              <span class="text-gray-700 dark:text-gray-300">{{ settings.fontSize }}px</span>
              <button
                (click)="updateFontSize(1)"
                class="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                A+
              </button>
            </div>
          </div>

          <!-- Font Family -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Family
            </label>
            <select
              [(ngModel)]="settings.fontFamily"
              (ngModelChange)="updateSettings({ fontFamily: $event })"
              class="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="system-ui">System Default</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>

          <!-- Theme -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <div class="flex space-x-4">
              <button
                *ngFor="let theme of themes"
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
            </div>
          </div>

          <!-- Layout -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Layout
            </label>
            <div class="flex space-x-4">
              <button
                *ngFor="let mode of viewModes"
                (click)="updateSettings({ viewMode: mode })"
                [class.bg-blue-100]="settings.viewMode === mode"
                [class.dark:bg-blue-900]="settings.viewMode === mode"
                class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                {{ mode | titlecase }}
              </button>
            </div>
          </div>

          <!-- Line Height -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Line Height
            </label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              [(ngModel)]="settings.lineHeight"
              (ngModelChange)="updateSettings({ lineHeight: $event })"
              class="w-full"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ settings.lineHeight }}x
            </span>
          </div>

          <!-- Margins -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Page Margins
            </label>
            <input
              type="range"
              min="0"
              max="64"
              step="8"
              [(ngModel)]="settings.margins"
              (ngModelChange)="updateSettings({ margins: $event })"
              class="w-full"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ settings.margins }}px
            </span>
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
export class SettingsModalComponent {
  @Output() close = new EventEmitter<void>();

  settings!: ReaderSettings;
  themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
  viewModes: Array<'scroll' | 'paginated'> = ['scroll', 'paginated'];

  constructor(private settingsService: SettingsService) {
    this.settingsService.settings$.subscribe(s => this.settings = s);
  }

  updateFontSize(delta: number) {
    const newSize = Math.max(12, Math.min(24, this.settings.fontSize + delta));
    this.updateSettings({ fontSize: newSize });
  }

  updateSettings(changes: Partial<ReaderSettings>) {
    this.settingsService.updateSettings(changes);
  }
}