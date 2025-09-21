import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet],
    template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class App {}