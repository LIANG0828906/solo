import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { BasePairData } from '../lib/DNAGeometry';

export type VisualMode = 'full' | 'backbone' | 'teaching';

export interface DNAVisualParams {
  turns: number;
  basePairSpacing: number;
  backboneWidth: number;
}

interface DNAContextType {
  params: DNAVisualParams;
  visualMode: VisualMode;
  highlightedBasePair: BasePairData | null;
  cameraTarget: [number, number, number];
  setParams: (p: Partial<DNAVisualParams>) => void;
  setVisualMode: (m: VisualMode) => void;
  setHighlightedBasePair: (bp: BasePairData | null) => void;
  clearHighlight: () => void;
  setCameraTarget: (target: [number, number, number]) => void;
}

const defaultParams: DNAVisualParams = {
  turns: 10,
  basePairSpacing: 1.0,
  backboneWidth: 0.25,
};

const DNAContext = createContext<DNAContextType | undefined>(undefined);

export const DNAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [params, setParamsState] = useState<DNAVisualParams>(defaultParams);
  const [visualMode, setVisualMode] = useState<VisualMode>('full');
  const [highlightedBasePair, setHighlightedBasePair] = useState<BasePairData | null>(null);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0, 0]);

  const setParams = useCallback((p: Partial<DNAVisualParams>) => {
    setParamsState((prev) => ({ ...prev, ...p }));
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedBasePair(null);
  }, []);

  return (
    <DNAContext.Provider
      value={{
        params,
        visualMode,
        highlightedBasePair,
        cameraTarget,
        setParams,
        setVisualMode,
        setHighlightedBasePair,
        clearHighlight,
        setCameraTarget,
      }}
    >
      {children}
    </DNAContext.Provider>
  );
};

export const useDNAContext = (): DNAContextType => {
  const ctx = useContext(DNAContext);
  if (!ctx) throw new Error('useDNAContext must be used within DNAProvider');
  return ctx;
};
