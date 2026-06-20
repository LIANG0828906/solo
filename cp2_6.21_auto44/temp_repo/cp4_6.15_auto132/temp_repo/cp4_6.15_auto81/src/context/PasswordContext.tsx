import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { PasswordContextType, PasswordResult } from '../types';
import { analyzePassword, COMMON_PASSWORDS } from '../analyzers/entropyAnalyzer';

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [password, setPassword] = useState<string>('');

  const result = useMemo<PasswordResult | null>(() => {
    if (!password) return null;
    return analyzePassword(password);
  }, [password]);

  const loadRandomCommonPassword = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * COMMON_PASSWORDS.length);
    setPassword(COMMON_PASSWORDS[randomIndex]);
  }, []);

  return (
    <PasswordContext.Provider value={{ password, setPassword, result, loadRandomCommonPassword }}>
      {children}
    </PasswordContext.Provider>
  );
};

export const usePassword = (): PasswordContextType => {
  const context = useContext(PasswordContext);
  if (context === undefined) {
    throw new Error('usePassword must be used within a PasswordProvider');
  }
  return context;
};
