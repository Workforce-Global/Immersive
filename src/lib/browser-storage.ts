export const browserStorage = {
  getBooks(): any[] {
    try {
      const data = localStorage.getItem('immersive-books');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setBooks(books: any[]): void {
    localStorage.setItem('immersive-books', JSON.stringify(books));
  },
};
