'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronRight, List, Grid3X3 } from 'lucide-react';
import { TitleBar } from '@/components/title-bar';
import { useBookStore } from '@/stores/book-store';
import { Book } from '@/types/book';

export default function DashboardPage() {
  const router = useRouter();
  const { books, init } = useBookStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'lastRead' | 'title' | 'author'>('lastRead');

  useEffect(() => {
    init();
  }, [init]);

  const currentBook = books.length > 0 ? books[0] : null;
  const recentBooks = [...books]
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      return b.lastRead.getTime() - a.lastRead.getTime();
    })
    .slice(1, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="titlebar"><TitleBar /></div>

      {currentBook && (
        <div className="relative content-below-titlebar">
          <div className="absolute inset-0 overflow-hidden">
            <img src={currentBook.coverUrl} className="w-full h-full object-cover blur-xl opacity-30" alt="" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-start space-x-8">
              <div className="shrink-0 w-48">
                <img src={currentBook.coverUrl} alt={currentBook.title} className="w-full rounded-lg shadow-lg" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{currentBook.title}</h1>
                <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">{currentBook.author}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{currentBook.language || 'EN'} Edition</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Progress</span>
                    <span className="text-gray-600 dark:text-gray-300">{(currentBook.progress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${currentBook.progress * 100}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/read/${currentBook.id}`)}
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-xs text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Books</h2>
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            >
              <option value="lastRead">Last Read</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${viewMode === 'list' ? 'text-blue-500' : ''}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${viewMode === 'grid' ? 'text-blue-500' : ''}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {recentBooks.map(book => (
              <div
                key={book.id}
                className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/read/${book.id}`)}
              >
                <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {recentBooks.map(book => (
              <div
                key={book.id}
                className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/read/${book.id}`)}
              >
                <div className="shrink-0 w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{book.author}</p>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${book.progress * 100}%` }} />
                    </div>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{(book.progress * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/library" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            View all books
            <ChevronRight className="ml-1 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
