import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { TitleBarComponent } from "../../components/title-bar.component";

@Component({
  selector: "app-splash",
  standalone: true,
  imports: [CommonModule, TitleBarComponent],
  template: `
    <div class="min-h-screen bg-gray-900 flex flex-col">
      <!-- Title Bar -->
      <app-title-bar></app-title-bar>

      <!-- Content -->
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
  `,
})
export class SplashComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(["/library"]);
    }, 2000);
  }
}