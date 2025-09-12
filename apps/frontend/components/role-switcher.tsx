'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Crown, 
  User, 
  ChevronDown, 
  Check,
  Sparkles,
  Zap
} from 'lucide-react';

export default function RoleSwitcher() {
  const { user, currentRole, switchRole, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.roles.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Crown : User;
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-purple-600' : 'text-blue-600';
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getRoleDescription = (role: string) => {
    return role === 'admin' 
      ? 'Manage tournaments, participants, and fixtures' 
      : 'Play matches, track progress, and connect with community';
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 h-auto bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {currentRole === 'admin' ? (
            <div className="flex items-center gap-1">
              <Crown className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Admin</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 rounded-full">
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-700">AI</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Player</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded-full">
                <Zap className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-700">AI</span>
              </div>
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-gray-900 mb-1">Switch Role</h3>
            <p className="text-sm text-gray-600">Choose your current view and permissions</p>
          </div>
          
          <div className="p-2">
            {user.roles.map((role) => {
              const Icon = getRoleIcon(role);
              const isActive = currentRole === role;
              
              return (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role as 'admin' | 'player');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-white shadow-sm' 
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${getRoleColor(role)}`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 capitalize">{role}</span>
                      {isActive && (
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{getRoleDescription(role)}</p>
                  </div>
                  
                  {isActive && (
                    <Badge className={getRoleBadgeColor(role)}>
                      Current
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI features adapt to your selected role</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
