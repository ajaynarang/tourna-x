'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Calendar,
  Command,
  GripVertical,
  LogOut,
  Search,
  Settings,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  keywords: string[];
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { user, logout, currentRole } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const adminCommands: CommandItem[] = [
    {
      id: 'admin-dashboard',
      title: 'Dashboard',
      subtitle: 'View overview and stats',
      icon: BarChart3,
      action: () => router.push('/admin/dashboard'),
      keywords: ['home', 'overview', 'stats', 'admin'],
      category: 'Navigate',
    },
    {
      id: 'admin-tournaments',
      title: 'Tournaments',
      subtitle: 'Manage tournaments',
      icon: Trophy,
      action: () => router.push('/admin/tournaments'),
      keywords: ['tournaments', 'events', 'competitions'],
      category: 'Navigate',
    },
    {
      id: 'admin-participants',
      title: 'Participants',
      subtitle: 'Manage participants',
      icon: Users,
      action: () => router.push('/admin/participants'),
      keywords: ['participants', 'players', 'users'],
      category: 'Navigate',
    },
    {
      id: 'admin-fixtures',
      title: 'Fixtures',
      subtitle: 'View and manage fixtures',
      icon: Calendar,
      action: () => router.push('/admin/fixtures'),
      keywords: ['fixtures', 'schedule', 'matches'],
      category: 'Navigate',
    },
    {
      id: 'admin-scoring',
      title: 'Scoring',
      subtitle: 'Manage scores',
      icon: Settings,
      action: () => router.push('/admin/scoring'),
      keywords: ['scoring', 'results', 'points'],
      category: 'Navigate',
    },
    {
      id: 'admin-analytics',
      title: 'Analytics',
      subtitle: 'View insights and reports',
      icon: BarChart3,
      action: () => router.push('/admin/analytics'),
      keywords: ['analytics', 'reports', 'insights', 'data'],
      category: 'Navigate',
    },
  ];

  const playerCommands: CommandItem[] = [
    {
      id: 'player-dashboard',
      title: 'Dashboard',
      subtitle: 'View your overview',
      icon: BarChart3,
      action: () => router.push('/player/dashboard'),
      keywords: ['home', 'overview', 'dashboard'],
      category: 'Navigate',
    },
    {
      id: 'player-matches',
      title: 'My Matches',
      subtitle: 'View your matches',
      icon: Calendar,
      action: () => router.push('/player/matches'),
      keywords: ['matches', 'fixtures', 'games'],
      category: 'Navigate',
    },
    {
      id: 'player-profile',
      title: 'My Profile',
      subtitle: 'Edit your profile',
      icon: User,
      action: () => router.push('/player/profile'),
      keywords: ['profile', 'account', 'settings'],
      category: 'Navigate',
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      subtitle: 'Browse tournaments',
      icon: Trophy,
      action: () => router.push('/tournaments'),
      keywords: ['tournaments', 'events', 'browse'],
      category: 'Navigate',
    },
  ];

  const commonCommands: CommandItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View and edit profile',
      icon: User,
      action: () => router.push('/profile'),
      keywords: ['profile', 'account', 'settings'],
      category: 'Navigate',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'View notifications',
      icon: Bell,
      action: () => router.push('/notifications'),
      keywords: ['notifications', 'alerts', 'updates'],
      category: 'Navigate',
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: LogOut,
      action: async () => {
        await logout();
        onClose();
      },
      keywords: ['logout', 'signout', 'exit'],
      category: 'Account',
    },
  ];

  const commands =
    currentRole === 'admin'
      ? [...adminCommands, ...commonCommands]
      : [...playerCommands, ...commonCommands];

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(kw => kw.includes(searchLower))
    );
  });

  // Keyboard shortcut to close with Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => {
          const newIndex = i < filteredCommands.length - 1 ? i + 1 : i;
          return newIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => {
          const newIndex = i > 0 ? i - 1 : 0;
          return newIndex;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
          setSearch('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (commandRefs.current[selectedIndex]) {
      commandRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset refs array when filtered commands change
  useEffect(() => {
    commandRefs.current = [];
  }, [filteredCommands.length]);

  return (
    <>
      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Container - Centered */}
            <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8 sm:py-16">
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="pointer-events-auto w-full max-w-5xl cursor-move"
              >
                <div className="glass-card-intense p-2">
                  {/* Drag Handle */}
                  <div className="mb-2 flex cursor-move items-center justify-center py-1">
                    <GripVertical className="text-muted h-4 w-4" />
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Type a command or search..."
                      autoFocus
                      className="text-primary placeholder:text-muted w-full border-0 bg-transparent px-12 py-4 text-lg outline-none"
                    />
                    <Command className="text-muted absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" />
                  </div>

                  {/* Divider */}
                  <div className="my-2 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

                  {/* Commands List */}
                  <div
                    ref={containerRef}
                    className="max-h-[400px] overflow-y-auto"
                  >
                    {filteredCommands.length === 0 ? (
                      <div className="text-muted py-12 text-center">
                        No results found
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredCommands.map((cmd, index) => {
                          const Icon = cmd.icon;
                          const isSelected = index === selectedIndex;

                          return (
                            <motion.button
                              key={cmd.id}
                              ref={el => {
                                commandRefs.current[index] = el;
                              }}
                              onClick={() => {
                                cmd.action();
                                onClose();
                                setSearch('');
                              }}
                              onMouseEnter={() => setSelectedIndex(index)}
                              initial={false}
                              animate={{
                                backgroundColor: isSelected
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'transparent',
                                borderColor: isSelected
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'transparent',
                              }}
                              className="group flex w-full items-center gap-4 rounded-lg border px-4 py-3 transition-all"
                            >
                              <div
                                className={`rounded-lg p-2 transition-all ${
                                  isSelected ? 'bg-green-500/20' : 'bg-white/5'
                                }`}
                              >
                                <Icon
                                  className={`h-5 w-5 transition-all ${
                                    isSelected
                                      ? 'text-green-400'
                                      : 'text-gray-400'
                                  }`}
                                />
                              </div>

                              <div className="flex-1 text-left">
                                <div
                                  className={`font-medium transition-colors ${
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-secondary'
                                  }`}
                                >
                                  {cmd.title}
                                </div>
                                {cmd.subtitle && (
                                  <div className="text-muted text-sm">
                                    {cmd.subtitle}
                                  </div>
                                )}
                              </div>

                              <div className="text-muted text-xs opacity-0 transition-opacity group-hover:opacity-100">
                                {cmd.category}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="my-2 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                  <div className="text-muted flex items-center justify-between px-4 py-2 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">
                          ↑↓
                        </kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">
                          ⏎
                        </kbd>
                        select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">
                          esc
                        </kbd>
                        close
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}