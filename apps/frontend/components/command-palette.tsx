'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { 
  Search, 
  Command, 
  User, 
  Settings, 
  LogOut, 
  Trophy, 
  Calendar, 
  Users,
  BarChart3,
  Bell,
  Archive
} from 'lucide-react';
import Link from 'next/link';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { user, logout, currentRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const adminCommands = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Participants', href: '/admin/participants', icon: Users },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
    { name: 'Scoring', href: '/admin/scoring', icon: Settings },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const playerCommands = [
    { name: 'Dashboard', href: '/player/dashboard', icon: BarChart3 },
    { name: 'My Matches', href: '/player/matches', icon: Calendar },
    { name: 'Profile', href: '/player/profile', icon: User },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  ];

  const commonCommands = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Archive', href: '/archive', icon: Archive },
  ];

  const commands = currentRole === 'admin' 
    ? [...adminCommands, ...commonCommands]
    : [...playerCommands, ...commonCommands];

  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl">
        <div className="glass-card-intense p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-tertiary" />
            <input
              type="text"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-primary placeholder:text-tertiary focus:outline-none"
              autoFocus
            />
            <Button variant="outline" size="sm" onClick={onClose}>
              <Command className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCommands.map((command) => (
              <Link key={command.href} href={command.href} onClick={onClose}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <command.icon className="h-4 w-4 text-tertiary" />
                  <span className="text-primary">{command.name}</span>
                </div>
              </Link>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-center py-8 text-tertiary">
                No commands found
              </div>
            )}

            <div className="border-t border-white/10 pt-2 mt-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}