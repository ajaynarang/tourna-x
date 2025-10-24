'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { RoleSwitcher } from '@/components/role-switcher';
import { motion } from 'framer-motion';
import {
  Search,
  User as UserIcon,
  LogOut,
  Phone,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  onCommandPaletteToggle: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function AppHeader({ onCommandPaletteToggle, pageTitle, pageSubtitle }: AppHeaderProps) {
  const { user, logout, currentRole } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (!user) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-background/95 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
      >
        <div className="px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <h1 className="gradient-title text-xl font-bold sm:text-2xl">
                Tourna-X
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={onCommandPaletteToggle}
                className="glass-card flex items-center gap-2 px-3 py-2 transition-transform hover:scale-105 sm:gap-3 sm:px-4 sm:py-2.5"
              >
                <Search className="h-4 w-4 text-green-400" />
                <span className="hidden text-sm text-gray-400 xl:inline">
                  Quick actions...
                </span>
                <kbd className="hidden rounded border border-white/10 bg-white/5 px-2 py-1 text-xs sm:block">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </motion.header>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background/95 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
    >
      <div className="px-4 py-4 sm:px-8">
        {/* Mobile: Two rows | Desktop: Single row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
          {/* Left Section: Branding + Page Title */}
          <div className="flex items-center justify-between lg:justify-start lg:gap-6">
            {/* App Branding */}
            <Link
              href={currentRole === 'admin' ? '/admin/dashboard' : '/player/dashboard'}
              className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <h1 className="gradient-title text-xl font-bold sm:text-2xl">
                Tourna-X
              </h1>
            </Link>

            {/* Separator (desktop only) */}
            {pageTitle && <div className="hidden h-8 w-px bg-white/10 lg:block" />}

            {/* Page Title (desktop only - hidden on mobile) */}
            {pageTitle && (
              <div className="hidden lg:block">
                <h2 className="text-primary text-base font-semibold sm:text-lg">
                  {pageTitle}
                </h2>
                {pageSubtitle && (
                  <p className="text-tertiary text-xs sm:text-sm">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            )}

            {/* Action Icons (mobile only - shown in first row) */}
            <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
              <RoleSwitcher />
              <ThemeToggle />

              <button
                onClick={onCommandPaletteToggle}
                className="glass-card flex items-center gap-2 px-3 py-2 transition-transform hover:scale-105 sm:gap-3 sm:px-4 sm:py-2.5"
              >
                <Search className="h-4 w-4 text-green-400" />
                <span className="hidden text-sm text-gray-400 xl:inline">
                  Quick actions...
                </span>
                <kbd className="hidden rounded border border-white/10 bg-white/5 px-2 py-1 text-xs sm:block">
                  ⌘K
                </kbd>
              </button>

              <Link
                href="/notifications"
                className="glass-card flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
              >
                <Bell className="h-4 w-4 text-green-400" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-card flex h-10 w-10 items-center justify-center rounded-full"
                  title="User menu"
                >
                  <UserIcon className="h-5 w-5 text-green-400" />
                </motion.button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="glass-card-intense absolute right-0 mt-2 w-64 rounded-xl border border-white/10 p-2"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    {/* User Info */}
                    <div className="border-b border-white/10 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-primary text-sm font-semibold">
                            {user?.name || 'User'}
                          </p>
                          {user?.phone && (
                            <p className="text-tertiary flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="text-secondary flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-secondary flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Action Icons (desktop only - shown in right section) */}
          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
            <RoleSwitcher />
            <ThemeToggle />

            <button
              onClick={onCommandPaletteToggle}
              className="glass-card flex items-center gap-2 px-3 py-2 transition-transform hover:scale-105 sm:gap-3 sm:px-4 sm:py-2.5"
            >
              <Search className="h-4 w-4 text-green-400" />
              <span className="hidden text-sm text-gray-400 xl:inline">
                Quick actions...
              </span>
              <kbd className="hidden rounded border border-white/10 bg-white/5 px-2 py-1 text-xs sm:block">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/notifications"
              className="glass-card flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
            >
              <Bell className="h-4 w-4 text-green-400" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card flex h-10 w-10 items-center justify-center rounded-full"
                title="User menu"
              >
                <UserIcon className="h-5 w-5 text-green-400" />
              </motion.button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="glass-card-intense absolute right-0 mt-2 w-64 rounded-xl border border-white/10 p-2"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  {/* User Info */}
                  <div className="border-b border-white/10 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-primary text-sm font-semibold">
                          {user?.name || 'User'}
                        </p>
                        {user?.phone && (
                          <p className="text-tertiary flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="text-secondary flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-secondary flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Second Row: Page Title (mobile only) */}
          {pageTitle && (
            <div className="lg:hidden">
              <h2 className="text-primary text-base font-semibold sm:text-lg">
                {pageTitle}
              </h2>
              {pageSubtitle && (
                <p className="text-tertiary text-xs sm:text-sm">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
