'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Trophy, 
  Calendar, 
  Users,
  BarChart3,
  Bell,
  Command
} from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  onCommandPaletteToggle: () => void;
}

export function AppHeader({ onCommandPaletteToggle }: AppHeaderProps) {
  const { user, logout, currentRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 glass-card-intense border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold gradient-title">
              Tourna-X
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Participants', href: '/admin/participants', icon: Users },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
    { name: 'Scoring', href: '/admin/scoring', icon: Settings },
  ];

  const playerNavItems = [
    { name: 'Dashboard', href: '/player/dashboard', icon: BarChart3 },
    { name: 'Matches', href: '/player/matches', icon: Calendar },
    { name: 'Profile', href: '/player/profile', icon: User },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  ];

  const navItems = currentRole === 'admin' ? adminNavItems : playerNavItems;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-card-intense border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={currentRole === 'admin' ? '/admin/dashboard' : '/player/dashboard'} className="text-xl font-bold gradient-title">
            Tourna-X
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-tertiary hover:text-primary transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onCommandPaletteToggle}
              variant="outline"
              size="sm"
              className="hidden sm:flex bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Command className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Search</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Link href="/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>

            <div className="relative">
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <User className="h-4 w-4" />
              </Button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card-intense p-2">
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 p-2 text-sm text-primary hover:bg-white/5 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 text-sm text-red-400 hover:bg-red-500/10 rounded w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="outline"
              size="sm"
              className="lg:hidden bg-white/5 border-white/10 hover:bg-white/10"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pt-4 border-t border-white/10">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 text-tertiary hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}