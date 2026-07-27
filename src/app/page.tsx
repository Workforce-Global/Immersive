'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TitleBar } from '@/components/title-bar';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <TitleBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <img src="/assets/logo-no-bg.png" alt="Immersive" className="w-48 h-auto mx-auto" />
          <p className="text-gray-400 text-lg">Your Personal Reading Companion</p>
        </div>
      </div>
    </div>
  );
}
