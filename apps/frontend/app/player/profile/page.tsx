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
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to profile...</p>
      </div>
    </div>
  );
}
