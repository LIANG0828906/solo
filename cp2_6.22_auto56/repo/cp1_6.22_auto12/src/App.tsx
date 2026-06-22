import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { GameCanvas } from '@/ui/GameCanvas';
import { HUD } from '@/ui/HUD';
import { GameState } from '@/types';

const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;
    setGameState({ ...engine.state });

    const gameLoop = (timestamp: number) => {
      if (!engineRef.current) return;

      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
      lastTimeRef.current = timestamp;

      engineRef.current.update(deltaTime);
      setGameState({ ...engineRef.current.state });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleMove = useCallback((dx: number, dy: number) => {
    if (!engineRef.current) return;
    engineRef.current.startMove(dx, dy);
  }, []);

  const handleInteract = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.interact();
  }, []);

  const handleAttack = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.heroAttack();
  }, []);

  const handleFlee = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.fleeCombat();
  }, []);

  const handleCollectLoot = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.collectLoot();

    setTimeout(() => {
      if (engineRef.current) {
        engineRef.current.state.scene = 'exploration';
        engineRef.current.state.combat = {
          monster: null,
          turn: 'hero',
          logs: [],
          logIndex: 0,
          charIndex: 0,
          isAnimating: false,
          drops: [],
          showLoot: false,
        };
      }
    }, 100);
  }, []);

  const handleEquipItem = useCallback((itemId: string) => {
    if (!engineRef.current) return;
    engineRef.current.equipItem(itemId);
  }, []);

  const handleUsePotion = useCallback((itemId: string) => {
    if (!engineRef.current) return;
    engineRef.current.usePotion(itemId);
  }, []);

  const handleSaveGame = async () => {
    if (!engineRef.current) return;
    const saveData = engineRef.current.getSaveData();
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      if (response.ok) {
        alert('游戏已保存！');
      }
    } catch (e) {
      console.error('保存失败', e);
    }
  };

  const handleLoadGame = async () => {
    try {
      const response = await fetch('/api/save');
      if (response.ok) {
        const data = await response.json();
        if (data && engineRef.current) {
          engineRef.current.loadSaveData(data);
          alert('游戏已加载！');
        }
      }
    } catch (e) {
      console.error('加载失败', e);
    }
  };

  if (!gameState) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0612',
        color: '#d4af37',
        fontFamily: 'serif',
        fontSize: 24,
      }}>
        正在加载地牢...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0612',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10, 6, 18, 0.7) 100%)',
          zIndex: 1,
        }}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: isMobile ? '100%' : 1100,
        height: isMobile ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <GameCanvas
          gameState={gameState}
          onMove={handleMove}
          onInteract={handleInteract}
          onAttack={handleAttack}
          onFlee={handleFlee}
          onCollectLoot={handleCollectLoot}
        />

        <HUD
          gameState={gameState}
          onEquipItem={handleEquipItem}
          onUsePotion={handleUsePotion}
        />
      </div>

      <div style={{
        position: 'absolute',
        top: 15,
        right: 15,
        display: 'flex',
        gap: 10,
        zIndex: 10,
      }}>
        <button
          onClick={handleSaveGame}
          style={{
            padding: '6px 14px',
            backgroundColor: 'rgba(26, 15, 46, 0.9)',
            color: '#d4af37',
            border: '1px solid #d4af37',
            borderRadius: '6px',
            fontFamily: 'serif',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          💾 保存
        </button>
        <button
          onClick={handleLoadGame}
          style={{
            padding: '6px 14px',
            backgroundColor: 'rgba(26, 15, 46, 0.9)',
            color: '#d4af37',
            border: '1px solid #d4af37',
            borderRadius: '6px',
            fontFamily: 'serif',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          📂 读取
        </button>
      </div>

      {isMobile && gameState.scene === 'exploration' && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          zIndex: 20,
        }}>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.6)',
              border: '3px solid #d4af37',
              color: '#fff',
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            👆
          </button>
        </div>
      )}

      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(212, 175, 55, 0.6)',
          fontFamily: 'serif',
          fontSize: 12,
          zIndex: 10,
        }}>
          WASD/方向键 移动 | E/空格 交互 | 战斗中 空格 攻击 | F 逃跑
        </div>
      )}
    </div>
  );
};

export default App;
