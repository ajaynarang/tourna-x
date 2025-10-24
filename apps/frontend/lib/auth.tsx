'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'player';

export interface User {
  _id: string;
  username?: string;
  roles: UserRole[];
  name: string;
  phone: string;
  email?: string;
  society?: string;
  block?: string;
  flatNumber?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  currentRole: UserRole | null;
  login: (username: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isAdmin: boolean;
  isPlayer: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Set initial role - prefer admin if available, otherwise player
          if (userData.roles?.includes('admin')) {
            setCurrentRole('admin');
          } else if (userData.roles?.includes('player')) {
            setCurrentRole('player');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Set initial role and redirect
        if (data.user.roles?.includes('admin')) {
          setCurrentRole('admin');
          router.push('/admin/dashboard');
        } else if (data.user.roles?.includes('player')) {
          setCurrentRole('player');
          router.push('/player/dashboard');
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentRole(null);
      router.push('/');
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          
          // Set initial role and redirect
          if (data.user.roles?.includes('admin')) {
            setCurrentRole('admin');
            router.push('/admin/dashboard');
          } else if (data.user.roles?.includes('player')) {
            setCurrentRole('player');
            router.push('/player/dashboard');
          }
        } else {
          throw new Error(data.error || 'Phone login failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Phone login failed');
      }
    } catch (error) {
      console.error('Phone login error:', error);
      throw error;
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const switchRole = (role: UserRole) => {
    if (user?.roles?.includes(role)) {
      setCurrentRole(role);
      // Redirect to appropriate dashboard
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'player') {
        router.push('/player/dashboard');
      }
    }
  };

  const hasRole = (role: UserRole) => {
    return user?.roles?.includes(role) || false;
  };

  const value = {
    user,
    isLoading,
    currentRole,
    login,
    loginWithPhone,
    sendOtp,
    logout,
    switchRole,
    isAdmin: currentRole === 'admin',
    isPlayer: currentRole === 'player',
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
