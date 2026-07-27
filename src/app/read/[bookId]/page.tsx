import { TitleBar } from '@/components/title-bar';
import { ReaderView } from '@/components/reader-view';

export function generateStaticParams() {
  return [{ bookId: '1' }];
}

export default function ReaderPage({ params }: { params: { bookId: string } }) {
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <TitleBar />
      <ReaderView bookId={params.bookId} />
    </div>
  );
}
