import { Component, OnInit } from "@angular/core";

import { Router } from "@angular/router";
import { TitleBarComponent } from "../../components/title-bar.component";

@Component({
    selector: "app-splash",
    imports: [TitleBarComponent],
    template: `
    <div class="min-h-screen bg-gray-900 flex flex-col">
      <app-title-bar></app-title-bar>

      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <img 
            src="assets/logo-no-bg.png" 
            alt="Immersive" 
            class="w-48 h-auto" 
          />
          <p class="text-gray-400 text-lg">Your Personal Reading Companion</p>
        </div>
      </div>
    </div>
  `
})
export class SplashComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(["/dashboard"]);
    }, 2000);
  }
}