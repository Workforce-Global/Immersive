'use client';

interface LoadingScreenProps {
  show: boolean;
  message?: string;
}

export function LoadingScreen({ show, message }: LoadingScreenProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}
