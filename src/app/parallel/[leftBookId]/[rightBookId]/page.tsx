import { ParallelReaderContent } from './content';

export function generateStaticParams() {
  return [{ leftBookId: '1', rightBookId: '2' }];
}

export default function ParallelReaderPage({ params }: { params: { leftBookId: string; rightBookId: string } }) {
  return <ParallelReaderContent leftBookId={params.leftBookId} rightBookId={params.rightBookId} />;
}
