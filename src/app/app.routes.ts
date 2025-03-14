import { Routes } from "@angular/router";
import { LibraryComponent } from "./pages/library/library.component";
import { ReaderComponent } from "./pages/reader/reader.component";
import { ParallelReaderComponent } from "./pages/reader/parallel-reader.component";
import { SplashComponent } from "./pages/splash/splash.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { BookResolver } from "./resolvers/book.resolver";

export const routes: Routes = [
  {
    path: "",
    component: SplashComponent,
    pathMatch: 'full'
  },
  {
    path: "dashboard",
    component: DashboardComponent,
  },
  {
    path: "library",
    component: LibraryComponent,
  },
  {
    path: "read/:bookId",
    component: ReaderComponent,
    resolve: {
      book: BookResolver,
    },
  },
  {
    path: "parallel/:leftBookId/:rightBookId",
    component: ParallelReaderComponent,
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];