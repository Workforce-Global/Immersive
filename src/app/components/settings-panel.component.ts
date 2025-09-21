import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ReaderSettings } from '../services/settings.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80">
      <h3 class="text-lg font-semibold mb-4">Display Settings</h3>
      
      <!-- Font Size -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Font Size</label>
        <div class="flex items-center space-x-2">
          <button class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  (click)="updateFontSize(-1)">-</button>
          <span>{{ settings.fontSize }}px</span>
          <button class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  (click)="updateFontSize(1)">+</button>
        </div>
      </div>

      <!-- Font Family -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Font Family</label>
        <select [(ngModel)]="settings.fontFamily"
                (ngModelChange)="updateSettings({ fontFamily: $event })"
                class="w-full p-2 rounded-sm border dark:bg-gray-700">
          <option value="system-ui">System Default</option>
          <option value="Georgia">Georgia</option>
          <option value="Palatino">Palatino</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      <!-- Line Height -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Line Height</label>
        <input type="range" min="1" max="2" step="0.1"
               [(ngModel)]="settings.lineHeight"
               (ngModelChange)="updateSettings({ lineHeight: $event })"
               class="w-full" />
        <span class="text-sm">{{ settings.lineHeight }}x</span>
      </div>

      <!-- Theme -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Theme</label>
        <div class="flex space-x-2">
          <button *ngFor="let themeOption of themes"
                  [class.ring-2]="settings.theme === themeOption"
                  class="w-8 h-8 rounded-full"
                  [ngClass]="{
                    'bg-white': themeOption === 'light',
                    'bg-gray-900': themeOption === 'dark',
                    'bg-[#f4ecd8]': themeOption === 'sepia'
                  }"
                  (click)="updateSettings({ theme: themeOption })">
          </button>
        </div>
      </div>

      <!-- View Mode -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">View Mode</label>
        <div class="flex space-x-2">
          <button *ngFor="let viewModeOption of viewModes"
                  [class.bg-blue-100]="settings.viewMode === viewModeOption"
                  class="px-3 py-1 rounded-sm"
                  (click)="updateSettings({ viewMode: viewModeOption })">
            {{ viewModeOption | titlecase }}
          </button>
        </div>
      </div>

      <!-- Margins -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Margins</label>
        <input type="range" min="0" max="64" step="8"
               [(ngModel)]="settings.margins"
               (ngModelChange)="updateSettings({ margins: $event })"
               class="w-full" />
        <span class="text-sm">{{ settings.margins }}px</span>
      </div>

      <!-- Max Width -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Max Width</label>
        <input type="range" min="400" max="1200" step="50"
               [(ngModel)]="settings.maxWidth"
               (ngModelChange)="updateSettings({ maxWidth: $event })"
               class="w-full" />
        <span class="text-sm">{{ settings.maxWidth }}px</span>
      </div>
    </div>
  `
})
export class SettingsPanelComponent implements OnInit {
  settings!: ReaderSettings;
  themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
  viewModes: Array<'scroll' | 'paginated'> = ['scroll', 'paginated'];

  constructor(private settingsService: SettingsService) {}

  async ngOnInit() {
    // Get initial settings
    this.settings = await firstValueFrom(this.settingsService.settings$);
    
    // Subscribe to settings changes
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