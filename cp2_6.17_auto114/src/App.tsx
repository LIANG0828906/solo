import React, { useEffect } from 'react';
import CrystalScene from './CrystalScene';
import ControlPanel from './ControlPanel';
import { useCrystalStore } from './store';
import { generateCrystal } from './CrystalGenerator';

export default function App() {
  const {
    crystalType,
    latticeConstant,
    isTransitioning,
    setAtoms,
    setBonds,
    isExploded,
  } = useCrystalStore();

  useEffect(() => {
    const { atoms, bonds } = generateCrystal(crystalType, latticeConstant);
    setAtoms(atoms);
    setBonds(bonds);
  }, [crystalType, latticeConstant, setAtoms, setBonds]);

  return (
    <div className="app-container">
      <ControlPanel />
      <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
        <CrystalScene />
        <div className={`scene-fade ${isTransitioning ? 'active' : ''}`} />
      </div>
    </div>
  );
}
