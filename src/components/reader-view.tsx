'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Cog, BookOpen } from 'lucide-react';
import { TocPanel } from '@/components/toc-panel';
import { SettingsModal } from '@/components/settings-modal';
import { SearchPanel } from '@/components/search-panel';
import { LookupPanel } from '@/components/lookup-panel';
import { ExcerptPanel } from '@/components/excerpt-panel';
import { LoadingScreen } from '@/components/loading-screen';
import { useBookStore } from '@/stores/book-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useLookup } from '@/hooks/use-lookup';
import { Book } from '@/types/book';

interface ReaderViewProps {
  bookId: string;
  parallelMode?: boolean;
}

export function ReaderView({ bookId, parallelMode }: ReaderViewProps) {
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const { books, readBookFile, updateBookProgress, addHighlight } = useBookStore();
  const { settings } = useSettingsStore();
  const { result: lookupResult, lookupWord } = useLookup();

  const [loading, setLoading] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [book, setBook] = useState<any>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedCfi, setSelectedCfi] = useState('');

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom] = useState(1.0);

  useEffect(() => {
    const check = () => setIsWideScreen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const found = books.find(b => b.id === bookId);
    if (found) setCurrentBook(found);
  }, [books, bookId]);

  const renderPdfPage = useCallback(async (doc: any, pageNum: number) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: zoom });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    const container = readerContainerRef.current;
    if (container) {
      container.innerHTML = '';
      container.appendChild(canvas);
      container.style.overflow = 'auto';
      container.style.position = 'relative';
    }
    if (currentBook) {
      updateBookProgress(currentBook, pageNum / doc.numPages);
    }
  }, [zoom, currentBook, updateBookProgress]);

  const loadPdf = useCallback(async (data: ArrayBuffer) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const doc = await pdfjsLib.getDocument(data).promise;
    setPdfDoc(doc);
    setCurrentPage(1);
    renderPdfPage(doc, 1);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    });
  }, [renderPdfPage]);

  const processToc = (items: any[], currentHref?: string, level = 0): any[] =>
    items.map((item: any) => ({
      id: crypto.randomUUID(),
      label: item.label,
      href: item.href,
      level,
      current: item.href === currentHref,
      subitems: item.subitems ? processToc(item.subitems, currentHref, level + 1) : [],
    }));

  const loadEpub = useCallback(async (data: ArrayBuffer) => {
    const ePub = (await import('epubjs')).default;
    const blob = new Blob([data], { type: 'application/epub+zip' });
    const url = URL.createObjectURL(blob);
    const epubBook = ePub(url, { openAs: 'epub' });
    setBook(epubBook);

    const container = readerContainerRef.current;
    if (!container) return;
    const rend = epubBook.renderTo(container, {
      width: '100%',
      height: '100%',
      spread: isWideScreen ? 'always' : 'none',
    });
    setRendition(rend);

    await epubBook.ready;
    const savedLocation = localStorage.getItem(`book-${bookId}-location`);
    if (savedLocation) {
      await rend.display(savedLocation);
    } else {
      await rend.display();
    }

    rend.on('relocated', (location: any) => {
      if (currentBook) {
        localStorage.setItem(`book-${bookId}-location`, location.start.cfi);
        updateBookProgress(currentBook, location.start.percentage);
        const update = (items: any[]): any[] =>
          items.map((item: any) => ({
            ...item, current: item.href === location.start.href,
            subitems: item.subitems ? update(item.subitems) : [],
          }));
        setTocItems((prev: any[]) => update(prev));
      }
    });

    rend.on('rendered', () => {
      setIsFirstPage(rend.location.start.percentage === 0);
    });

    rend.on('selected', (cfiRange: string, contents: any) => {
      const selection = contents.window.getSelection();
      const text = selection.toString().trim();
      if (text) {
        setSelectedText(text);
        setSelectedCfi(cfiRange);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setContextMenuPos({ x: rect.right, y: rect.bottom });
        setShowContextMenu(true);
      }
    });

    const navigation = await epubBook.loaded.navigation;
    const currentLocation = await rend.currentLocation();
    const loc = currentLocation as { start?: { href?: string } } | null;
    setTocItems(processToc(navigation.toc, loc?.start?.href));

    return () => {
      URL.revokeObjectURL(url);
      epubBook.destroy();
    };
  }, [isWideScreen, bookId, currentBook, updateBookProgress]);

  const loadBook = useCallback(async (path: string) => {
    try {
      setLoading(true);
      const data = await readBookFile(path);
      if (currentBook?.format === 'pdf') {
        await loadPdf(data);
      } else {
        await loadEpub(data);
      }
    } catch (err) {
      console.error('Failed to load book:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBook, readBookFile, loadPdf, loadEpub]);

  useEffect(() => {
    if (currentBook) loadBook(currentBook.path);
  }, [currentBook, loadBook]);

  const navigateToLocation = (target: string) => {
    if (target.startsWith('#')) target = target.substring(1);
    rendition?.display(target);
  };

  const handlePrev = async () => {
    if (currentBook?.format === 'pdf') {
      if (pdfDoc && currentPage > 1) {
        const page = currentPage - 1;
        setCurrentPage(page);
        renderPdfPage(pdfDoc, page);
      }
    } else {
      rendition?.prev();
    }
  };

  const handleNext = async () => {
    if (currentBook?.format === 'pdf') {
      if (pdfDoc && currentPage < pdfDoc.numPages) {
        const page = currentPage + 1;
        setCurrentPage(page);
        renderPdfPage(pdfDoc, page);
      }
    } else {
      rendition?.next();
    }
  };

  const handleHighlight = () => {
    setShowContextMenu(false);
    if (!currentBook || !rendition) return;
    rendition.annotations.highlight(selectedCfi, {}, () => {});
    addHighlight(currentBook, selectedCfi, selectedText, 'yellow');
  };

  useEffect(() => {
    if (!rendition || !settings) return;
    rendition.themes.fontSize(settings.fontSize + 'px');
    rendition.themes.font(settings.fontFamily);
    const themes: Record<string, any> = {
      light: { body: { background: '#ffffff', color: '#000000' } },
      dark: { body: { background: '#1a1a1a', color: '#ffffff' } },
      sepia: { body: { background: '#f4ecd8', color: '#5f4b32' } },
    };
    rendition.themes.register(settings.theme, themes[settings.theme]);
    rendition.themes.select(settings.theme);
    rendition.flow(settings.viewMode === 'scroll' ? 'scrolled' : 'paginated');
    rendition.themes.override('margin', `0 ${settings.margins}px`);
    rendition.themes.override('max-width', `${settings.maxWidth}px`);
  }, [rendition, settings]);

  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <LoadingScreen show={loading} message="Loading book..." />
      <div className={`flex flex-1 overflow-hidden ${parallelMode ? '' : ''}`}>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 dark:border-gray-700 ${showToc ? 'w-64' : 'w-0'}`}>
          <TocPanel toc={tocItems} onNavigate={navigateToLocation} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button onClick={() => setShowToc(!showToc)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{currentBook?.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Cog className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <div ref={readerContainerRef} className={`absolute inset-0 ${isFirstPage ? 'first-page' : ''}`} />
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button onClick={handlePrev} className="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-r-lg transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button onClick={handleNext} className="p-4 bg-gray-800/20 hover:bg-gray-800/40 text-white rounded-l-lg transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-sm">
              <div className="absolute h-full bg-blue-500 rounded-sm transition-all duration-300" style={{ width: `${(currentBook?.progress || 0) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden border-l border-gray-200 dark:border-gray-700 ${showSearch ? 'w-80' : 'w-0'}`}>
          <SearchPanel book={book} onNavigate={navigateToLocation} />
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <div className="fixed right-8 top-24 space-y-4 z-50">
        {showLookup && <LookupPanel result={lookupResult} onClose={() => setShowLookup(false)} />}
        {showExcerpt && currentBook && (
          <ExcerptPanel bookId={bookId} text={selectedText} cfi={selectedCfi} onClose={() => setShowExcerpt(false)} />
        )}
      </div>

      {showContextMenu && (
        <div className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[160px] z-50" style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
          <button onClick={() => { setShowContextMenu(false); setShowLookup(true); lookupWord(selectedText); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Look Up
          </button>
          <button onClick={() => { setShowContextMenu(false); setShowExcerpt(true); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Save Excerpt
          </button>
          <button onClick={handleHighlight} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Highlight
          </button>
        </div>
      )}
    </>
  );
}
