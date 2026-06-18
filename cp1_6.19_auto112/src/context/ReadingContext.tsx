import { createContext, useContext } from 'react';
import { ReadingContextValue } from '../types';

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function useReadingContext(): ReadingContextValue {
  const ctx = useContext(ReadingContext);
  if (!ctx) {
    throw new Error('useReadingContext must be used within ReadingProvider');
  }
  return ctx;
}

export default ReadingContext;
