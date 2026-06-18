import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PLANETS, PlanetData } from '@/data/planets';
import { SolarSystem } from '@/scene/SolarSystem';
import { ControlPanel } from '@/ui/ControlPanel';
import { PlanetDetail } from '@/ui/PlanetDetail';

interface AppContextType {
  planets: PlanetData[];
  selectedPlanetId: string | null;
  speedMultiplier: number;
  isDetailOpen: boolean;
  selectPlanet: (id: string | null) => void;
  setSpeed: (speed: number) => void;
  resetView: () => void;
}

const AppContext = createContext<AppContextType>({
  planets: PLANETS,
  selectedPlanetId: null,
  speedMultiplier: 1,
  isDetailOpen: false,
  selectPlanet: () => {},
  setSpeed: () => {},
  resetView: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}

export default function App() {
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const selectPlanet = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedPlanetId(null);
      setIsDetailOpen(false);
    } else {
      setSelectedPlanetId(id);
      setIsDetailOpen(true);
    }
  }, []);

  const resetView = useCallback(() => {
    setSelectedPlanetId(null);
    setIsDetailOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      planets: PLANETS,
      selectedPlanetId,
      speedMultiplier,
      isDetailOpen,
      selectPlanet,
      setSpeed: setSpeedMultiplier,
      resetView,
    }),
    [selectedPlanetId, speedMultiplier, isDetailOpen, selectPlanet, resetView]
  );

  const selectedPlanet = useMemo(
    () => PLANETS.find((p) => p.id === selectedPlanetId) ?? null,
    [selectedPlanetId]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <div style={styles.app}>
        <div style={styles.sceneWrap}>
          <SolarSystem
            planets={PLANETS}
            selectedPlanetId={selectedPlanetId}
            speedMultiplier={speedMultiplier}
            onPlanetClick={selectPlanet}
          />
        </div>
        <div style={styles.leftPanel}>
          <ControlPanel
            planets={PLANETS}
            selectedPlanetId={selectedPlanetId}
            speedMultiplier={speedMultiplier}
            onPlanetSelect={(id) => selectPlanet(id)}
            onSpeedChange={setSpeedMultiplier}
          />
        </div>
        <div style={styles.rightPanel}>
          <PlanetDetail
            planet={selectedPlanet}
            isOpen={isDetailOpen}
            onClose={() => selectPlanet(null)}
            onResetView={resetView}
          />
        </div>
      </div>
    </AppContext.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(ellipse at center, #1A1A3A 0%, #0B0E1A 70%)',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  sceneWrap: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  leftPanel: {
    position: 'absolute' as const,
    top: 20,
    left: 20,
    zIndex: 5,
  },
  rightPanel: {
    position: 'absolute' as const,
    top: 20,
    right: 20,
    zIndex: 5,
  },
};
