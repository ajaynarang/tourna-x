'use client';

import MobileBottomNavigation from '@/components/layout/mobile-bottom-navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CommandPalette } from '@/components/command-palette';
import Providers from '@/components/providers';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  return (
    <Providers>
      <div className="relative min-h-screen">
        <AppHeader
          onCommandPaletteToggle={() => setIsCommandPaletteOpen(true)}
        />
        <main className="relative z-10 pb-20 lg:pb-0">{children}</main>
        <MobileBottomNavigation />
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      <Toaster position="top-right" richColors />
    </Providers>
  );
}

