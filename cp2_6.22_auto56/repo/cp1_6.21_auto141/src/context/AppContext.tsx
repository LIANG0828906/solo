import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type CycloneType = 'cyclone' | 'anticyclone';

export interface ParticleParams {
  cycloneType: CycloneType;
  windSpeed: number;
  particleDensity: number;
}

export interface Preset {
  id: string;
  name: string;
  cycloneType: CycloneType;
  windSpeed: number;
  particleDensity: number;
  createdAt: string;
}

interface AppContextValue extends ParticleParams {
  setCycloneType: (type: CycloneType) => void;
  setWindSpeed: (speed: number) => void;
  setParticleDensity: (density: number) => void;
  updateParams: (params: Partial<ParticleParams>) => void;
  params: ParticleParams;
}

const defaultParams: ParticleParams = {
  cycloneType: 'cyclone',
  windSpeed: 5,
  particleDensity: 2000,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<ParticleParams>(defaultParams);

  const setCycloneType = useCallback((type: CycloneType) => {
    setParams(prev => ({ ...prev, cycloneType: type }));
  }, []);

  const setWindSpeed = useCallback((speed: number) => {
    setParams(prev => ({ ...prev, windSpeed: speed }));
  }, []);

  const setParticleDensity = useCallback((density: number) => {
    setParams(prev => ({ ...prev, particleDensity: density }));
  }, []);

  const updateParams = useCallback((newParams: Partial<ParticleParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...params,
        setCycloneType,
        setWindSpeed,
        setParticleDensity,
        updateParams,
        params,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
