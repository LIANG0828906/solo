import React, { createContext, useState, useContext } from 'react';
import type { StarContextType, CelestialBody } from '../types';

const StarContext = createContext<StarContextType | undefined>(undefined);

export const StarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);

  return (
    <StarContext.Provider
      value={{
        selectedBody,
        setSelectedBody,
        showOrbits,
        setShowOrbits,
        showAtmosphere,
        setShowAtmosphere,
      }}
    >
      {children}
    </StarContext.Provider>
  );
};

export const useStarContext = () => {
  const context = useContext(StarContext);
  if (context === undefined) {
    throw new Error('useStarContext must be used within a StarProvider');
  }
  return context;
};
