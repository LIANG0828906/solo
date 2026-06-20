import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameScene } from './game/GameScene';
import { StatusBar } from './components/StatusBar';
import { TowerPanel } from './components/TowerPanel';
import { GameOverlay } from './components/GameOverlay';
import { LevelData, GameState, TowerType } from './game/types';
import { eventBus } from './game/EventBus';

const App: React.FC = () => {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentWave, setCurrentWave] = useState(0);
  const [totalWaves, setTotalWaves] = useState(20);
  const [playerEnergy, setPlayerEnergy] = useState(200);
  const [monstersKilled, setMonstersKilled] = useState(0);
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [selectedTowerSlot, setSelectedTowerSlot] = useState<string | null>(null);
  const [towerPanelPosition, setTowerPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);

  const gameSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        const response = await fetch('/api/levels/level-1');
        const data = await response.json();
        setLevelData(data);
        setTotalWaves(data.waves.length);
        setPlayerEnergy(data.startEnergy);
      } catch (error) {
        console.error('Failed to fetch level:', error);
      }
    };

    fetchLevel();
  }, []);

  const handleTowerSlotClick = useCallback((slotId: string | null) => {
    if (slotId && levelData) {
      const slot = levelData.towerPositions.find((s) => s.id === slotId);
      if (slot) {
        const x = (window.innerWidth / 30) * (slot.x + 15);
        const y = (window.innerHeight / 15) * (7.5 - slot.y);
        setTowerPanelPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 });
      }
    } else {
      setTowerPanelPosition(null);
    }
    setSelectedTowerSlot(slotId);
  }, [levelData]);

  const handleSelectTower = useCallback((type: TowerType) => {
    if (selectedTowerSlot) {
      eventBus.emit('tower:place', { positionId: selectedTowerSlot, type });
    }
    setSelectedTowerSlot(null);
    setTowerPanelPosition(null);
  }, [selectedTowerSlot]);

  const handleStartWave = useCallback(() => {
    if (currentWave < totalWaves) {
      setCurrentWave((prev) => prev + 1);
      setGameState('playing');
    }
  }, [currentWave, totalWaves]);

  const handleWaveComplete = useCallback((wave: number) => {
    if (wave >= totalWaves) {
      setGameState('victory');
      setGameResult('victory');
    } else {
      setGameState('idle');
    }
  }, [totalWaves]);

  const handleMonsterKilled = useCallback(() => {
    setMonstersKilled((prev) => prev + 1);
    setScore((prev) => prev + 10);
  }, []);

  const handleEnergyChange = useCallback((energy: number) => {
    setPlayerEnergy(energy);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('defeat');
    setGameResult('defeat');
  }, []);

  const handleVictory = useCallback(() => {
    setGameState('victory');
    setGameResult('victory');
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentWave(0);
    setPlayerEnergy(levelData?.startEnergy || 200);
    setMonstersKilled(0);
    setScore(0);
    setGameState('idle');
    setGameResult(null);
    setSelectedTowerSlot(null);
    setTowerPanelPosition(null);
    window.location.reload();
  }, [levelData]);

  const handleSpeedChange = useCallback((speed: number) => {
    setSpeedMultiplier(speed);
  }, []);

  return (
    <div style={styles.container}>
      <div ref={gameSceneRef} style={styles.gameContainer}>
        <GameScene
          levelData={levelData}
          gameState={gameState}
          speedMultiplier={speedMultiplier}
          onEnergyChange={handleEnergyChange}
          onWaveComplete={handleWaveComplete}
          onMonsterKilled={handleMonsterKilled}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          selectedTowerSlot={selectedTowerSlot}
          onTowerSlotClick={handleTowerSlotClick}
          playerEnergy={playerEnergy}
          currentWave={currentWave}
        />
      </div>

      <StatusBar
        energy={playerEnergy}
        monstersKilled={monstersKilled}
        currentWave={currentWave}
        totalWaves={totalWaves}
        isPlaying={gameState === 'playing' || gameState === 'paused'}
        isPaused={gameState === 'paused'}
        speedMultiplier={speedMultiplier}
        onStartWave={handleStartWave}
        onTogglePause={handleTogglePause}
        onSpeedChange={handleSpeedChange}
      />

      <TowerPanel
        isOpen={selectedTowerSlot !== null}
        position={towerPanelPosition}
        playerEnergy={playerEnergy}
        onSelectTower={handleSelectTower}
        onClose={() => handleTowerSlotClick(null)}
      />

      <GameOverlay
        type={gameResult}
        score={score}
        monstersKilled={monstersKilled}
        currentWave={currentWave}
        onRestart={handleRestart}
      />

      <div style={styles.title}>
        <h1 style={styles.titleText}>塔防光域</h1>
        <p style={styles.subtitle}>Tower Defense Light Realm</p>
      </div>

      <div style={styles.instructions}>
        <p>点击塔位部署能量塔 | 点击反射镜旋转 | 1/2/3 快捷键选择塔</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  gameContainer: {
    width: '100%',
    height: '100%',
  },
  title: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    color: '#fff',
    zIndex: 50,
    pointerEvents: 'none',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 0 20px rgba(0, 230, 118, 0.5)',
    color: '#00e676',
  },
  subtitle: {
    fontSize: 12,
    margin: '4px 0 0 0',
    color: '#666',
    letterSpacing: 2,
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#666',
    fontSize: 12,
    zIndex: 50,
    pointerEvents: 'none',
  },
};

export default App;
