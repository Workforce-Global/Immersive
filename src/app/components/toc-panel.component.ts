import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronRight } from '@ng-icons/heroicons/outline';

interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
  level: number;
  current?: boolean;
}

@Component({
    selector: 'app-toc-panel',
    imports: [CommonModule, NgIconComponent],
    providers: [provideIcons({ heroChevronRight })],
    template: `
    <div class="h-full bg-white dark:bg-gray-800 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Table of Contents
        </h2>
      </div>

      <!-- TOC Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="p-2">
          <ng-container *ngFor="let item of toc">
            <div
              [class.pl-4]="item.level > 0"
              class="group"
            >
              <button
                (click)="navigate.emit(item.href)"
                class="w-full text-left py-2 px-3 rounded-md flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700"
                [class.bg-blue-50]="item.current"
                [class.dark:bg-blue-900]="item.current"
              >
                <span 
                  class="text-sm"
                  [class.text-blue-600]="item.current"
                  [class.dark:text-blue-400]="item.current"
                  [class.text-gray-900]="!item.current"
                  [class.dark:text-gray-100]="!item.current"
                >
                  {{ item.label }}
                </span>
                <ng-icon
                  *ngIf="item.subitems?.length"
                  name="heroChevronRight"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 transform transition-transform"
                  [class.rotate-90]="item.current"
                >
                </ng-icon>
              </button>
            </div>

            <!-- Subitems -->
            <ng-container *ngIf="item.subitems?.length && item.current">
              <div
                *ngFor="let subitem of item.subitems"
                class="pl-8"
              >
                <button
                  (click)="navigate.emit(subitem.href)"
                  class="w-full text-left py-2 px-3 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  [class.text-blue-600]="subitem.current"
                  [class.dark:text-blue-400]="subitem.current"
                >
                  {{ subitem.label }}
                </button>
              </div>
            </ng-container>
          </ng-container>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.7);
    }
  `]
})
export class TocPanelComponent {
  @Input() toc: TocItem[] = [];
  @Output() navigate = new EventEmitter<string>();
}