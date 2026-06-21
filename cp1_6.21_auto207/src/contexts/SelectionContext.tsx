import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SelectionData } from '../types';

interface SelectionContextValue {
  selection: SelectionData | null;
  setSelection: (data: SelectionData | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selection, setSelectionState] = useState<SelectionData | null>(null);

  const setSelection = useCallback((data: SelectionData | null) => {
    setSelectionState(data);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(null);
  }, []);

  const value = useMemo<SelectionContextValue>(
    () => ({ selection, setSelection, clearSelection }),
    [selection, setSelection, clearSelection]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = (): SelectionContextValue => {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return ctx;
};

export default SelectionContext;
