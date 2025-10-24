'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { ChevronDown, Shield, User, Check } from 'lucide-react';

export function RoleSwitcher() {
  const { user, currentRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user || !user.roles || user.roles.length <= 1) {
    return null; // Don't show switcher if user has only one role or no roles
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'player':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'player':
        return 'Player';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500 dark:text-red-400';
      case 'player':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white transition-all hover:bg-gray-200 dark:hover:bg-white/20"
      >
        <div className={getRoleColor(currentRole || '')}>
          {getRoleIcon(currentRole || '')}
        </div>
        <span className="hidden sm:inline">
          {getRoleLabel(currentRole || '')}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-black/90 backdrop-blur-md shadow-lg">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              Switch Role
            </div>
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  switchRole(role as 'admin' | 'player');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                  currentRole === role
                    ? 'bg-gray-100 dark:bg-white/20 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={getRoleColor(role)}>
                  {getRoleIcon(role)}
                </div>
                <span className="flex-1 text-left">
                  {getRoleLabel(role)}
                </span>
                {currentRole === role && (
                  <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
