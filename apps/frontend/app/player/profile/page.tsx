'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PlayerProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the shared profile page
    router.replace('/profile');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to profile...</p>
        </div>
    </div>
  );
}
