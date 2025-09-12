'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { 
  Menu, 
  X, 
  Trophy, 
  Users, 
  Calendar, 
  Calculator, 
  Home, 
  Settings, 
  LogIn, 
  User,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleSwitcher from '@/components/role-switcher';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, isAdmin, isPlayer, logout, hasRole } = useAuth();

  // Hide navigation on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const adminNavigation = [
    {
      section: 'Tournament Management',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
        { name: 'Participants', href: '/admin/participants', icon: Users },
        { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
        { name: 'Scoring', href: '/admin/scoring', icon: Calculator },
      ]
    }
  ];

  const playerNavigation = [
    {
      section: 'Player Dashboard',
      items: [
        { name: 'My Dashboard', href: '/player/dashboard', icon: Home },
        { name: 'My Matches', href: '/player/matches', icon: Calendar },
      ]
    }
  ];

  const publicNavigation = [
    {
      section: 'Public Access',
      items: []
    }
  ];

  const getNavigationItems = () => {
    if (isAdmin) return adminNavigation;
    if (isPlayer) return playerNavigation;
    return publicNavigation;
  };

  const navigation = getNavigationItems();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-gray-900">Tourna-X</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                {hasRole('admin') && hasRole('player') && (
                  <RoleSwitcher />
                )}
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-lg">Tourna-X</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {navigation.map((section) => (
                    section.items.length > 0 && (
                      <div key={section.section}>
                        <button
                          onClick={() => toggleSection(section.section)}
                          className="flex items-center justify-between w-full p-3 text-left font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <span>{section.section}</span>
                          {expandedSection === section.section ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        
                        {expandedSection === section.section && (
                          <div className="ml-4 space-y-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const active = isActive(item.href);
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onClick={() => setIsOpen(false)}
                                  className={cn(
                                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                                    active 
                                      ? "bg-primary text-primary-foreground font-medium" 
                                      : "hover:bg-gray-100"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </nav>
              </div>

              {/* User Section */}
              <div className="p-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {user.name || user.username}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user.roles?.[0] || 'user'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Role Switcher */}
                    {hasRole('admin') && hasRole('player') && (
                      <div className="px-3">
                        <RoleSwitcher />
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={logout}
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
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
        </div>
      )}
    </>
  );
}
