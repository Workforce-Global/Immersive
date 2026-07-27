'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Home, Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  const router = useRouter();

  const handleMinimize = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      await getCurrentWebviewWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const win = getCurrentWebviewWindow();
      const isMaximized = await win.isMaximized();
      isMaximized ? await win.unmaximize() : await win.maximize();
    }
  };

  const handleClose = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      await getCurrentWebviewWindow().close();
    }
  };

  return (
    <div
      className="flex items-center justify-between h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center px-4 space-x-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/library')}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="flex-1 text-center py-2.5" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h1 className="font-medium text-gray-700 dark:text-gray-200 truncate">
          Immersive Reader
        </h1>
      </div>

      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Square className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={handleClose}
          className="p-2.5 hover:bg-red-500 focus:outline-hidden group"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
