import React, { ReactNode } from 'react';
import { MoleculeContext, createStoreState } from './moleculeStore';

export const MoleculeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = createStoreState();
  return <MoleculeContext.Provider value={value}>{children}</MoleculeContext.Provider>;
};
