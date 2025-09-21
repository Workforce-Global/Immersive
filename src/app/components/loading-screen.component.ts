import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-loading-screen',
    imports: [],
    template: `
    @if (show) {
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
          <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-300">{{ message || 'Loading...' }}</p>
        </div>
      </div>
    }
    `
})
export class LoadingScreenComponent {
  @Input() show: boolean = false;
  @Input() message?: string;
}