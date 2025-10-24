'use client';

import React, { createContext, useContext, useState } from 'react';

interface ScoringContextType {
  isScoring: boolean;
  setIsScoring: (isScoring: boolean) => void;
}

const ScoringContext = createContext<ScoringContextType | undefined>(undefined);

export function ScoringProvider({ children }: { children: React.ReactNode }) {
  const [isScoring, setIsScoring] = useState(false);

  return (
    <ScoringContext.Provider value={{ isScoring, setIsScoring }}>
      {children}
    </ScoringContext.Provider>
  );
}

export function useScoring() {
  const context = useContext(ScoringContext);
  if (context === undefined) {
    throw new Error('useScoring must be used within a ScoringProvider');
  }
  return context;
}
