'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { 
  Home, 
  Trophy, 
  Calendar, 
  User, 
  BarChart3,
  Users,
  Settings,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNavigation() {
  const { user, currentRole } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Practice', href: '/practice-matches', icon: Target },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
    { name: 'Scoring', href: '/admin/scoring', icon: Settings },
  ];

  const playerNavItems = [
    { name: 'Dashboard', href: '/player/dashboard', icon: BarChart3 },
    { name: 'Practice', href: '/practice-matches', icon: Target },
    { name: 'Matches', href: '/player/matches', icon: Calendar },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const navItems = currentRole === 'admin' ? adminNavItems : playerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-card-intense border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 p-2 h-auto ${
                  isActive 
                    ? 'text-primary bg-white/10' 
                    : 'text-tertiary hover:text-primary hover:bg-white/5'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-xs">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}