import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroMinus, 
  heroSquares2x2, 
  heroXMark,
  heroChevronLeft,
  heroHome
} from '@ng-icons/heroicons/outline';
import { Router } from '@angular/router';
import { appWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'app-title-bar',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({ 
      heroMinus, 
      heroSquares2x2, 
      heroXMark,
      heroChevronLeft,
      heroHome
    })
  ],
  template: `
    <div class="flex items-center justify-between h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none">
      <!-- Left section -->
      <div class="flex items-center px-4 space-x-4 titlebar-drag-region">
        <div class="flex items-center space-x-2">
          <button 
            (click)="navigateBack()"
            class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none no-drag"
          >
            <ng-icon
              name="heroChevronLeft"
              class="w-5 h-5 text-gray-600 dark:text-gray-300">
            </ng-icon>
          </button>
          <button 
            (click)="navigateHome()"
            class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none no-drag"
          >
            <ng-icon
              name="heroHome"
              class="w-5 h-5 text-gray-600 dark:text-gray-300">
            </ng-icon>
          </button>
        </div>
      </div>

      <!-- Center section (draggable) -->
      <div class="flex-1 text-center titlebar-drag-region py-2.5">
        <h1 class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          Immersive Reader
        </h1>
      </div>

      <!-- Right section -->
      <div class="flex items-center">
        <button
          (click)="minimizeWindow()"
          class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none no-drag"
        >
          <ng-icon
            name="heroMinus"
            class="w-4 h-4 text-gray-600 dark:text-gray-300">
          </ng-icon>
        </button>
        <button
          (click)="maximizeWindow()"
          class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none no-drag"
        >
          <ng-icon
            name="heroSquares2x2"
            class="w-4 h-4 text-gray-600 dark:text-gray-300">
          </ng-icon>
        </button>
        <button
          (click)="closeWindow()"
          class="p-2.5 hover:bg-red-500 focus:outline-none group no-drag"
        >
          <ng-icon
            name="heroXMark"
            class="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-white">
          </ng-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .titlebar-drag-region {
      -webkit-app-region: drag;
      flex: 1;
    }
    .no-drag {
      -webkit-app-region: no-drag;
    }
  `]
})
export class TitleBarComponent {
  private router = inject(Router);

  async minimizeWindow() {
    if (window.__TAURI__) {
      await appWindow.minimize();
    }
  }

  async maximizeWindow() {
    if (window.__TAURI__) {
      const isMaximized = await appWindow.isMaximized();
      isMaximized ? await appWindow.unmaximize() : await appWindow.maximize();
    }
  }

  async closeWindow() {
    if (window.__TAURI__) {
      await appWindow.close();
    }
  }

  navigateBack() {
    this.router.navigate(['/library']);
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
