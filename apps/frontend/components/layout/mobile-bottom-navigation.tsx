'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Home,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { isAdmin, isPlayer } = useAuth();

  // Hide navigation on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home, color: 'text-purple-600' },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy, color: 'text-purple-600' },
    { name: 'Participants', href: '/admin/participants', icon: Users, color: 'text-purple-600' },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar, color: 'text-purple-600' },
  ];

  const playerNavigation = [
    { name: 'Dashboard', href: '/player/dashboard', icon: Home, color: 'text-blue-600' },
    { name: 'Matches', href: '/player/matches', icon: Calendar, color: 'text-blue-600' },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy, color: 'text-blue-600' },
    { name: 'Profile', href: '/player/profile', icon: User, color: 'text-blue-600' },
  ];

  const publicNavigation = [
    { name: 'Home', href: '/', icon: Home, color: 'text-gray-600' },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy, color: 'text-gray-600' },
  ];

  const getNavigationItems = () => {
    if (isAdmin) return adminNavigation;
    if (isPlayer) return playerNavigation;
    return publicNavigation;
  };

  const navigation = getNavigationItems();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-40">
      <div className={`grid h-16 ${navigation.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-200 relative",
                active 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-200",
                active 
                  ? "bg-primary/10 shadow-sm" 
                  : "hover:bg-gray-100"
              )}>
                <Icon className={cn("h-5 w-5", active && "text-primary", item.color)} />
              </div>
              <span className={cn("text-xs font-medium", active && "text-primary")}>
                {item.name}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
