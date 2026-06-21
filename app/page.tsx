'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page - middleware will handle authentication check
    router.push('/auth');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">⚽ FIFA Bets</h1>
        <p className="text-slate-400 mb-8">Redirecting...</p>
      </div>
    </div>
  );
}
