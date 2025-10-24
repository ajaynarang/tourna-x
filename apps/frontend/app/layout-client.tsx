'use client';

import MobileBottomNavigation from '@/components/layout/mobile-bottom-navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CommandPalette } from '@/components/command-palette';
import Providers from '@/components/providers';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePageTitle } from '@/hooks/use-page-title';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  const { title, subtitle } = usePageTitle();

  // Check if we're on landing page or auth pages (no header)
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

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
      <Providers>
        <div className="relative min-h-screen">
          <main className="relative z-10 w-full">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </Providers>
    );
  }

  return (
    <Providers>
      <div className="relative min-h-screen">
        <AppHeader
          onCommandPaletteToggle={() => setIsCommandPaletteOpen(true)}
          pageTitle={title}
          pageSubtitle={subtitle}
        />
        <main className="relative z-10 w-full pb-20 lg:pb-0">{children}</main>
        {/* <MobileBottomNavigation /> */}
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      <Toaster position="top-right" richColors />
    </Providers>
  );
}

