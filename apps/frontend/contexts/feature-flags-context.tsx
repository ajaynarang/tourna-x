'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureFlags } from '@repo/schemas';

interface FeatureFlagsContextType {
  flags: FeatureFlags | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Helper functions for checking feature access
  canAccessPracticeMatches: (role: 'player' | 'admin') => boolean;
  canAccessTournaments: (role: 'player' | 'admin') => boolean;
  canAccessPracticeStats: (role: 'player' | 'admin') => boolean;
  canAccessTournamentStats: (role: 'player' | 'admin') => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/feature-flags');
      const data = await response.json();
      
      if (data.success) {
        setFlags(data.data);
      } else {
        setError(data.error || 'Failed to fetch feature flags');
      }
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError('Failed to fetch feature flags');
      // Set default flags on error
      setFlags({
        practiceMatches: {
          enabled: true,
          playerEnabled: true,
          adminEnabled: true,
          statsEnabled: true,
        },
        tournaments: {
          enabled: true,
          playerEnabled: true,
          adminEnabled: true,
          statsEnabled: true,
        },
        updatedAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Helper function to check practice matches access
  const canAccessPracticeMatches = (role: 'player' | 'admin'): boolean => {
    if (!flags?.practiceMatches) return true; // Default to true if flags not loaded
    
    const { enabled, playerEnabled, adminEnabled } = flags.practiceMatches;
    
    if (!enabled) return false; // Global toggle
    
    if (role === 'player') return playerEnabled;
    if (role === 'admin') return adminEnabled;
    
    return false;
  };

  // Helper function to check tournaments access
  const canAccessTournaments = (role: 'player' | 'admin'): boolean => {
    if (!flags?.tournaments) return true; // Default to true if flags not loaded
    
    const { enabled, playerEnabled, adminEnabled } = flags.tournaments;
    
    if (!enabled) return false; // Global toggle
    
    if (role === 'player') return playerEnabled;
    if (role === 'admin') return adminEnabled;
    
    return false;
  };

  // Helper function to check practice stats access
  const canAccessPracticeStats = (role: 'player' | 'admin'): boolean => {
    if (!flags?.practiceMatches) return true; // Default to true if flags not loaded
    
    const { enabled, playerEnabled, adminEnabled, statsEnabled } = flags.practiceMatches;
    
    // Stats require both the feature to be enabled and stats specifically enabled
    if (!enabled || !statsEnabled) return false;
    
    if (role === 'player') return playerEnabled;
    if (role === 'admin') return adminEnabled;
    
    return false;
  };

  // Helper function to check tournament stats access
  const canAccessTournamentStats = (role: 'player' | 'admin'): boolean => {
    if (!flags?.tournaments) return true; // Default to true if flags not loaded
    
    const { enabled, playerEnabled, adminEnabled, statsEnabled } = flags.tournaments;
    
    // Stats require both the feature to be enabled and stats specifically enabled
    if (!enabled || !statsEnabled) return false;
    
    if (role === 'player') return playerEnabled;
    if (role === 'admin') return adminEnabled;
    
    return false;
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        loading,
        error,
        refetch: fetchFlags,
        canAccessPracticeMatches,
        canAccessTournaments,
        canAccessPracticeStats,
        canAccessTournamentStats,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

