'use client';

import { useRef, useState } from 'react';
import { ReaderView } from '@/components/reader-view';
import { TitleBar } from '@/components/title-bar';

interface ContentProps {
  leftBookId: string;
  rightBookId: string;
}

export function ParallelReaderContent({ leftBookId, rightBookId }: ContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(50);

  const startResize = (e: React.MouseEvent) => {
    const parent = containerRef.current;
    if (!parent) return;
    const initialX = e.clientX;
    const initialWidth = parent.offsetWidth;

    const doDrag = (e: MouseEvent) => {
      const delta = e.clientX - initialX;
      const pct = Math.min(Math.max(20, ((initialWidth + delta) / parent.offsetWidth) * 100), 80);
      setLeftWidth(pct);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <TitleBar />
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col">
          <ReaderView bookId={leftBookId} parallelMode />
        </div>
        <div
          className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 shrink-0"
          onMouseDown={startResize}
        />
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col">
          <ReaderView bookId={rightBookId} parallelMode />
        </div>
      </div>
    </div>
  );
}
