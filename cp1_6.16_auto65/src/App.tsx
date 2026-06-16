import React, { useState, useCallback, useRef, useEffect } from 'react';
import GameCanvas, { CANVAS_WIDTH, CANVAS_HEIGHT } from './ui/GameCanvas';
import UIPanel from './ui/UIPanel';
import { GameManager, getGameManager } from './engine/GameManager';
import { GameState, ParticleParams } from './engine/types';
import { ParticleEffect } from './ui/ParticleEffect';

export default function App() {
  const gameManagerRef = useRef<GameManager>(getGameManager());
  const [gameState, setGameState] = useState<GameState>(gameManagerRef.current.getState());
  const particleRef = useRef<ParticleEffect>(new ParticleEffect());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStateUpdate = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleSpellCast = useCallback((params: ParticleParams) => {
    particleRef.current.startEffect(params);
  }, []);

  useEffect(() => {
    particleRef.current = new ParticleEffect();
    return () => {
      particleRef.current.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'serif',
      }}
    >
      <div style={{
        position: 'relative',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
      }}>
        <GameCanvas
          gameManager={gameManagerRef.current}
          onStateUpdate={handleStateUpdate}
        />
        <UIPanel
          gameManager={gameManagerRef.current}
          gameState={gameState}
          onSpellCast={handleSpellCast}
        />
      </div>
    </div>
  );
}
