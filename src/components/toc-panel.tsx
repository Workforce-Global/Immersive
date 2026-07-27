'use client';

import { ChevronRight } from 'lucide-react';

interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
  level: number;
  current?: boolean;
}

interface TocPanelProps {
  toc: TocItem[];
  onNavigate: (href: string) => void;
}

export function TocPanel({ toc, onNavigate }: TocPanelProps) {
  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Table of Contents
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {toc.map(item => (
            <div key={item.id}>
              <div className={item.level > 0 ? 'pl-4' : ''}>
                <button
                  onClick={() => onNavigate(item.href)}
                  className={`w-full text-left py-2 px-3 rounded-md flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    item.current ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                >
                  <span
                    className={`text-sm ${
                      item.current
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.subitems && item.subitems.length > 0 && (
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                        item.current ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>
              </div>
              {item.subitems && item.subitems.length > 0 && item.current && (
                <div className="pl-8">
                  {item.subitems.map(subitem => (
                    <button
                      key={subitem.id}
                      onClick={() => onNavigate(subitem.href)}
                      className={`w-full text-left py-2 px-3 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        subitem.current
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {subitem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
