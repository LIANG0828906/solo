import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SeaBattle from './scene/SeaBattle';
import Panel from './ui/Panel';
import './styles.css';

export type FormationType = 'v' | 'diamond' | 'crescent';

export interface ShipData {
  id: number;
  position: [number, number, number];
  targetPosition: [number, number, number];
  health: number;
  maxHealth: number;
}

const App: React.FC = () => {
  const [currentFormation, setCurrentFormation] = useState<FormationType>('v');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedShipId, setSelectedShipId] = useState<number | null>(null);
  const [isFiring, setIsFiring] = useState(false);
  const [ships, setShips] = useState<ShipData[]>([]);

  const formationPositions = useMemo((): Record<FormationType, [number, number, number][]> => ({
    v: [
      [0, 0, 0],
      [-3, 0, 4], [3, 0, 4],
      [-6, 0, 8], [0, 0, 8], [6, 0, 8],
      [-9, 0, 12], [-3, 0, 12], [3, 0, 12], [9, 0, 12],
      [-12, 0, 16], [-6, 0, 16], [0, 0, 16], [6, 0, 16], [12, 0, 16],
      [-15, 0, 20], [-9, 0, 20], [-3, 0, 20], [3, 0, 20], [9, 0, 20]
    ],
    diamond: [
      [0, 0, 0],
      [-4, 0, 4], [4, 0, 4], [0, 0, 6],
      [-8, 0, 8], [-4, 0, 8], [0, 0, 10], [4, 0, 8], [8, 0, 8],
      [-12, 0, 12], [-8, 0, 12], [-4, 0, 12], [0, 0, 14], [4, 0, 12], [8, 0, 12], [12, 0, 12],
      [-8, 0, 16], [-4, 0, 16], [0, 0, 18], [4, 0, 16], [8, 0, 16]
    ],
    crescent: [
      [-14, 0, 2], [-10, 0, 5], [-6, 0, 8],
      [-2, 0, 10], [2, 0, 10], [6, 0, 8],
      [10, 0, 5], [14, 0, 2],
      [-11, 0, 10], [-7, 0, 13], [-3, 0, 15],
      [1, 0, 15], [5, 0, 13], [9, 0, 10],
      [-8, 0, 18], [-4, 0, 20], [0, 0, 21],
      [4, 0, 20], [8, 0, 18], [0, 0, 5]
    ]
  }), []);

  const formationStats = useMemo(() => ({
    v: { name: '雁行阵', firepower: 95, hitChance: 45, desc: 'V型冲锋阵型，火力集中，适合突击' },
    diamond: { name: '鱼鳞阵', firepower: 88, hitChance: 35, desc: '菱形防御阵型，层层递进，防御力强' },
    crescent: { name: '偃月阵', firepower: 100, hitChance: 55, desc: '弧形包围阵型，火力覆盖广，攻击面大' }
  }), []);

  useEffect(() => {
    const positions = formationPositions[currentFormation];
    setShips(prevShips => {
      if (prevShips.length === 0) {
        return positions.map((pos, idx) => ({
          id: idx,
          position: [...pos] as [number, number, number],
          targetPosition: [...pos] as [number, number, number],
          health: 100,
          maxHealth: 100
        }));
      }
      return prevShips.map((ship, idx) => ({
        ...ship,
        targetPosition: [...(positions[idx] || ship.targetPosition)] as [number, number, number]
      }));
    });
  }, [currentFormation, formationPositions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFormationChange = useCallback((formation: FormationType) => {
    setCurrentFormation(formation);
    setSelectedShipId(null);
  }, []);

  const handleShipSelect = useCallback((id: number | null) => {
    setSelectedShipId(id);
  }, []);

  const handleShipPositionUpdate = useCallback((id: number, position: [number, number, number]) => {
    setShips(prev => prev.map(ship => 
      ship.id === id 
        ? { ...ship, position, targetPosition: position }
        : ship
    ));
  }, []);

  const handleFire = useCallback(() => {
    if (isFiring) return;
    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 3000);
  }, [isFiring]);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const stats = formationStats[currentFormation];

  return (
    <div className="app-container">
      <div className="sky-gradient" />
      
      <Panel
        currentFormation={currentFormation}
        onFormationChange={handleFormationChange}
        onFire={handleFire}
        onTogglePause={handleTogglePause}
        isPaused={isPaused}
        isFiring={isFiring}
        stats={stats}
      />

      <div className="scene-container">
        <Canvas
          shadows
          camera={{ position: [0, 25, -25], fov: 60 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#1a2a3a']} />
          <fog attach="fog" args={['#1a2a3a', 40, 80]} />
          
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <hemisphereLight args={['#87ceeb', '#0a2a4a', 0.4]} />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={60}
            maxPolarAngle={Math.PI / 2.2}
          />

          <SeaBattle
            ships={ships}
            selectedShipId={selectedShipId}
            onShipSelect={handleShipSelect}
            onShipPositionUpdate={handleShipPositionUpdate}
            isPaused={isPaused}
            isFiring={isFiring}
            currentFormation={currentFormation}
          />
        </Canvas>

        <div className="command-prompt">
          水师指挥台 - 按空格键暂停/恢复 · 鼠标拖拽旋转视角 · 滚轮缩放
        </div>
      </div>
    </div>
  );
};

export default App;
