import { Component, OnInit } from '@angular/core';

import { ReaderComponent } from './reader.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-parallel-reader',
    imports: [ReaderComponent],
    template: `
    <div class="h-screen flex">
      <!-- Left book -->
      <div class="flex-1 border-r border-gray-200 dark:border-gray-700">
        <app-reader
          [bookId]="leftBookId"
          [parallelMode]="true"
        ></app-reader>
      </div>

      <!-- Resizer -->
      <div
        class="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500"
        (mousedown)="startResize($event)"
      ></div>

      <!-- Right book -->
      <div class="flex-1">
        <app-reader
          [bookId]="rightBookId"
          [parallelMode]="true"
        ></app-reader>
      </div>
    </div>
  `
})
export class ParallelReaderComponent implements OnInit {
  leftBookId: string = '';
  rightBookId: string = '';
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.leftBookId = params['leftBookId'];
      this.rightBookId = params['rightBookId'];
    });
  }

  startResize(e: MouseEvent) {
    const container = e.target as HTMLElement;
    const parent = container.parentElement as HTMLElement;
    const leftPane = parent.children[0] as HTMLElement;
    const initialX = e.clientX;
    const initialWidth = leftPane.offsetWidth;

    const doDrag = (e: MouseEvent) => {
      const delta = e.clientX - initialX;
      const containerWidth = parent.offsetWidth;
      const newWidth = Math.min(
        Math.max(200, initialWidth + delta),
        containerWidth - 200
      );
      
      leftPane.style.width = `${newWidth}px`;
      parent.children[2].setAttribute('style', `width: ${containerWidth - newWidth - 4}px`);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }
}