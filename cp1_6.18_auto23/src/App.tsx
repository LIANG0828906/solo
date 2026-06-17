import React, { useEffect, useState } from 'react';
import { useStore, selectSeed, selectIsTransitioning } from '@store/stateManager';
import MoleculeGarden from '@components/MoleculeGarden';
import ControlPanel from '@components/ControlPanel';
import type { SeedParams } from '@/types';

const App: React.FC = () => {
  const seed: SeedParams = useStore(selectSeed);
  const isTransitioning = useStore(selectIsTransitioning);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const layoutStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    overflow: 'hidden',
  };

  const sceneWrapperStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    background: 'radial-gradient(ellipse at center, #1A1A3A 0%, #0A0E27 70%, #05071A 100%)',
  };

  return (
    <div style={layoutStyle}>
      <ControlPanel isMobile={isMobile} />
      <div style={sceneWrapperStyle}>
        <MoleculeGarden seed={seed} isTransitioning={isTransitioning} />
      </div>
    </div>
  );
};

export default App;
