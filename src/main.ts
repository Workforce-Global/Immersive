import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app.component';
import { routes } from './app/app.routes';
import './global_styles.css';


bootstrapApplication(App, {
  providers: [
    provideRouter(routes)
  ]
});