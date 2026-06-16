import React, { useRef, useCallback, useEffect, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { WorldSnapshot } from './game/World';
import { GameCanvas } from './ui/GameCanvas';
import { HUD } from './ui/HUD';
import { UpgradePanel } from './ui/UpgradePanel';
import { useGameStore } from './store/GameStore';

const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const {
    score, moveSpeedLevel, basketLevel, shieldLevel,
    depositResult, upgrade, addNotification, updateNotifications,
    isUpgradeOpen, setPaused,
  } = useGameStore();

  if (!engineRef.current) {
    const engine = new GameEngine();
    engineRef.current = engine;
  }
  const engine = engineRef.current;

  const handleSnapshot = useCallback((snap: WorldSnapshot) => {
    setSnapshot(snap);
    updateNotifications(1 / 60);

    if (snap.playerShield <= 0 && !gameOver) {
      setGameOver(true);
      setPaused(true);
    }
  }, [updateNotifications, gameOver, setPaused]);

  const handleUpgrade = useCallback((type: 'speed' | 'basket' | 'shield') => {
    const player = engine.getWorld().player;
    const levelKey = type === 'speed' ? 'moveSpeedLevel' : type === 'basket' ? 'basketLevel' : 'shieldLevel';
    const currentLevel = player.state[levelKey];
    const cost = player.getUpgradeCost(currentLevel);

    if (score < cost) return;

    let success = false;
    if (type === 'speed') success = player.upgradeMoveSpeed();
    else if (type === 'basket') success = player.upgradeBasket();
    else success = player.upgradeShield();

    if (success) {
      upgrade(type, cost, currentLevel + 1);
    }
  }, [engine, score, upgrade]);

  const handleRestart = useCallback(() => {
    const newEngine = new GameEngine();
    engineRef.current = newEngine;
    engine.stop();
    setGameOver(false);
    setPaused(false);
    useGameStore.setState({
      score: 0,
      collectedItems: [],
      playerLevel: 1,
      currentEvent: null,
      isPaused: false,
      isUpgradeOpen: false,
      notifications: [],
      moveSpeedLevel: 0,
      basketLevel: 0,
      shieldLevel: 0,
    });
  }, [engine]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#0a0a2e', fontFamily: 'Poppins, sans-serif',
    }}>
      <h1 style={{ color: '#ADD8E6', fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>
        DeepClean
      </h1>
      <p style={{ color: '#6688AA', fontSize: 12, marginBottom: 12 }}>
        WASD/方向键移动 | 空格收集 | E投放回收站
      </p>
      <div style={{ position: 'relative' }}>
        <GameCanvas engine={engine} onSnapshot={handleSnapshot} />
        <HUD snapshot={snapshot} />
        <UpgradePanel
          moveSpeedLevel={moveSpeedLevel}
          basketLevel={basketLevel}
          shieldLevel={shieldLevel}
          speed={snapshot?.playerSpeed ?? 2}
          basketCapacity={snapshot?.playerBasketCapacity ?? 8}
          maxShield={snapshot?.playerMaxShield ?? 100}
          onUpgrade={handleUpgrade}
        />
      </div>
      {gameOver && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.85)', borderRadius: 16, padding: 32, textAlign: 'center',
          zIndex: 200,
        }}>
          <h2 style={{ color: '#FF4444', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>游戏结束</h2>
          <p style={{ color: '#FFD700', fontSize: 18, marginBottom: 16 }}>最终积分: {score}</p>
          <button
            onClick={handleRestart}
            style={{
              background: '#00CC00', color: '#FFFFFF', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
