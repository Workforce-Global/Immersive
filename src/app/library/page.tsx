'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Plus, Cog, Search, Trash2, EllipsisVertical, ChevronRight, Check, X, Menu
} from 'lucide-react';
import { TitleBar } from '@/components/title-bar';
import { LoadingScreen } from '@/components/loading-screen';
import { LibrarySettingsModal } from '@/components/library-settings-modal';
import { useBookStore } from '@/stores/book-store';
import { Book } from '@/types/book';

export default function LibraryPage() {
  const router = useRouter();
  const { books, loading, init, importBooks, deleteBook } = useBookStore();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sortBy, setSortBy] = useState<'lastRead' | 'title' | 'author' | 'progress'>('lastRead');
  const [filters, setFilters] = useState({ epub: true, pdf: true, notStarted: true, inProgress: true, completed: true });

  useEffect(() => { init(); }, [init]);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
  }, [books, searchQuery]);

  const displayedBooks = useMemo(() => {
    return books.filter(book => {
      if (!filters.epub && book.format === 'epub') return false;
      if (!filters.pdf && book.format === 'pdf') return false;
      const p = book.progress;
      if (!filters.notStarted && p === 0) return false;
      if (!filters.inProgress && p > 0 && p < 1) return false;
      if (!filters.completed && p === 1) return false;
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title);
        case 'author': return a.author.localeCompare(b.author);
        case 'progress': return b.progress - a.progress;
        default: return b.lastRead.getTime() - a.lastRead.getTime();
      }
    });
  }, [books, filters, sortBy]);

  const toggleSelect = (bookId: string) => {
    setSelectedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const count = selectedBooks.size;
    if (count === 0) return;
    if (!confirm(`Are you sure you want to delete ${count} selected book${count > 1 ? 's' : ''}?`)) return;
    for (const bookId of selectedBooks) {
      const book = books.find(b => b.id === bookId);
      if (book) await deleteBook(book);
    }
    setSelectedBooks(new Set());
    setMultiSelect(false);
  };

  const handleImport = async () => {
    setLoadingMessage('Importing books...');
    await importBooks();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="titlebar"><TitleBar /></div>
      <LoadingScreen show={loading} message={loadingMessage} />

      <div className={`library-sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="w-full p-2 rounded-md border dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="lastRead">Recently Read</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="progress">Progress</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Format</label>
            <div className="space-y-2">
              {(['epub', 'pdf'] as const).map(f => (
                <label key={f} className="flex items-center">
                  <input type="checkbox" checked={filters[f]} onChange={() => setFilters(prev => ({ ...prev, [f]: !prev[f] }))} className="rounded-sm border-gray-300" />
                  <span className="ml-2">{f.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Progress</label>
            <div className="space-y-2">
              {(['notStarted', 'inProgress', 'completed'] as const).map(p => (
                <label key={p} className="flex items-center">
                  <input type="checkbox" checked={filters[p]} onChange={() => setFilters(prev => ({ ...prev, [p]: !prev[p] }))} className="rounded-sm border-gray-300" />
                  <span className="ml-2">{p === 'notStarted' ? 'Not Started' : p === 'inProgress' ? 'In Progress' : 'Completed'}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={() => setFilters({ epub: true, pdf: true, notStarted: true, inProgress: true, completed: true })} className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Reset Filters
          </button>
        </div>
      </div>

      <div className={`library-content ${showSidebar ? 'sidebar-open' : ''}`}>
        <header className="bg-white dark:bg-gray-800 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Library</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={handleImport} disabled={multiSelect} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${multiSelect ? 'opacity-50' : ''}`}>
                  <Plus className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={() => { setMultiSelect(!multiSelect); if (multiSelect) setSelectedBooks(new Set()); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  {multiSelect ? <X className="h-6 w-6 text-gray-600 dark:text-gray-300" /> : <Check className="h-6 w-6 text-gray-600 dark:text-gray-300" />}
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Cog className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            {showSearchResults && searchQuery && filteredBooks.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                {filteredBooks.map(book => (
                  <div
                    key={book.id}
                    className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => router.push(`/read/${book.id}`)}
                  >
                    <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden shrink-0">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{book.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {multiSelect && selectedBooks.size > 0 && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Selected ({selectedBooks.size})
              </button>
            </div>
          )}

          {displayedBooks.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Books</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {displayedBooks.map(book => (
                  <div
                    key={book.id}
                    className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden max-w-[180px] ${
                      multiSelect && selectedBooks.has(book.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => multiSelect ? toggleSelect(book.id) : router.push(`/read/${book.id}`)}
                  >
                    {multiSelect && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedBooks.has(book.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {selectedBooks.has(book.id) && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    )}
                    <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 max-h-[240px]">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{book.author}</p>
                      <div className="mt-2">
                        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${book.progress * 100}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(book.progress * 100).toFixed(0)}% complete</p>
                      </div>
                    </div>
                    {!multiSelect && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedBook(book); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <EllipsisVertical className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {books.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No books</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by importing your first book</p>
              <div className="mt-6">
                <button onClick={handleImport} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="h-5 w-5 mr-2" />
                  Import Book
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedBook && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBook(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-full h-48 object-cover" />
              <button onClick={() => setSelectedBook(null)} className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/50 text-white hover:bg-gray-900/75">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedBook.title}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">By {selectedBook.author}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Reading Progress</span>
                  <span>{(selectedBook.progress * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedBook.progress * 100}%` }} />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setSelectedBook(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Close
                </button>
                <button onClick={() => { deleteBook(selectedBook); setSelectedBook(null); }} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && <LibrarySettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
