'use client';

import MobileBottomNavigation from '@/components/layout/mobile-bottom-navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CommandPalette } from '@/components/command-palette';
import Providers from '@/components/providers';
import { ScoringProvider, useScoring } from '@/contexts/scoring-context';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePageTitle } from '@/hooks/use-page-title';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  const { title, subtitle } = usePageTitle();
  const { isScoring } = useScoring();

  // Check if we're on landing page, auth pages, or print pages (no header)
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.includes('/bracket-print');

  // Register service worker for PWA (only in production)
  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('PWA disabled for local development');
    }
  }, []);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (isPublicPage) {
    return (
      <div className="relative min-h-screen">
        <main className="relative z-10 w-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {!isScoring && (
        <AppHeader
          onCommandPaletteToggle={() => setIsCommandPaletteOpen(true)}
          pageTitle={title}
          pageSubtitle={subtitle}
        />
      )}
      <main className="relative z-10 w-full pb-20 lg:pb-0">{children}</main>
      {/* <MobileBottomNavigation /> */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ScoringProvider>
        <LayoutContent>{children}</LayoutContent>
        <Toaster position="top-right" richColors />
      </ScoringProvider>
    </Providers>
  );
}

