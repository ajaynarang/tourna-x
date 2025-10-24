'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'player')[];
  fallbackPath?: string;
}

export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/' 
}: AuthGuardProps) {
  const { user, isLoading, currentRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If roles are required, check if user has any of them
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.roles?.includes(role)
      );

      if (!hasRequiredRole) {
        router.push(fallbackPath);
        return;
      }

      // If user has required role but currentRole is not set or wrong, set it
      if (!currentRole || !requiredRoles.includes(currentRole)) {
        const firstAvailableRole = requiredRoles.find(role => 
          user.roles?.includes(role)
        );
        if (firstAvailableRole) {
          // This will be handled by the auth context
          router.push(fallbackPath);
          return;
        }
      }
    }
  }, [user, isLoading, currentRole, requiredRoles, router, fallbackPath]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // If no user, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  // If roles are required, check current role
  if (requiredRoles.length > 0 && !currentRole) {
    return null;
  }

  // If current role doesn't match required roles, don't render
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentRole!)) {
    return null;
  }

  return <>{children}</>;
}
