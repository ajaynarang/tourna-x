'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Calculator, 
  Home, 
  LogIn, 
  User,
  Bell,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DesktopNavigation() {
  const pathname = usePathname();
  const { user, isAdmin, isPlayer, logout } = useAuth();

  // Hide navigation on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Participants', href: '/admin/participants', icon: Users },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
    { name: 'Scoring', href: '/admin/scoring', icon: Calculator },
  ];

  const playerNavigation = [
    { name: 'Dashboard', href: '/player/dashboard', icon: Home },
    { name: 'My Matches', href: '/player/matches', icon: Calendar },
  ];

  const publicNavigation: Array<{ name: string; href: string; icon: any }> = [];

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
    <nav className="hidden lg:block bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={isAdmin ? "/admin/dashboard" : isPlayer ? "/player/dashboard" : "/"} 
                  className="flex items-center space-x-2 text-xl font-bold text-primary">
              <Trophy className="h-6 w-6" />
              <span>Tourna-X</span>
            </Link>
            
            {navigation.length > 0 && (
              <div className="flex items-center space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.name || user.username}</span>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full capitalize">
                    {user.roles?.[0] || 'user'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <User className="h-4 w-4 mr-2" />
                    Register
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
