import { Routes } from "@angular/router";
import { LibraryComponent } from "./pages/library/library.component";
import { ReaderComponent } from "./pages/reader/reader.component";
import { ParallelReaderComponent } from "./pages/reader/parallel-reader.component";
import { SplashComponent } from "./pages/splash/splash.component";
import { BookResolver } from "./resolvers/book.resolver";

export const routes: Routes = [
  {
    path: "",
    component: SplashComponent,
    pathMatch: 'full' // Only match empty path exactly
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
    path: '**', // Catch all route
    redirectTo: 'library' // Redirect to library for any unknown routes
  }
];