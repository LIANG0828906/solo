import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MainMenu } from './ui/MainMenu';
import { GameUI } from './ui/GameUI';
import { GameOver } from './ui/GameOver';
import { GameCanvas } from './engine/GameCanvas';
import { AudioManager } from './audio/AudioManager';
import { eventBus } from './core/EventBus';
import './App.css';

type GameScreen = 'menu' | 'playing' | 'gameover';

interface GameResult {
  score: number;
  coins: number;
  time: number;
}

function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [playerName, setPlayerName] = useState<string>('匿名玩家');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<GameCanvas | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasScaleRef = useRef<number>(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleGameOver = (result: GameResult) => {
      setGameResult(result);
      setTimeout(() => {
        setScreen('gameover');
      }, 500);
    };

    const unsub = eventBus.on('gameOver', handleGameOver);
    return unsub;
  }, []);

  const handleAudioTimeUpdate = useCallback((timeMs: number) => {
    if (gameCanvasRef.current) {
      gameCanvasRef.current.setAudioTime(timeMs);
    }
  }, []);

  const startGame = useCallback(async () => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
      audioManagerRef.current.setOnTimeUpdate(handleAudioTimeUpdate);
    }

    try {
      await audioManagerRef.current.init();
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }

    setScreen('playing');
    setGameResult(null);

    setTimeout(() => {
      if (canvasRef.current) {
        gameCanvasRef.current = new GameCanvas(canvasRef.current);
        gameCanvasRef.current.start();
        
        if (audioManagerRef.current) {
          audioManagerRef.current.play();
        }
      }
    }, 100);
  }, [handleAudioTimeUpdate]);

  const handlePause = useCallback(() => {
    eventBus.emit('pauseToggle');
    if (audioManagerRef.current) {
      audioManagerRef.current.pause();
    }
  }, []);

  const handleResume = useCallback(() => {
    eventBus.emit('pauseToggle');
    if (audioManagerRef.current) {
      audioManagerRef.current.play();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
    }
    if (gameCanvasRef.current) {
      gameCanvasRef.current.destroy();
      gameCanvasRef.current = null;
    }
    setScreen('menu');
    setTimeout(() => {
      startGame();
    }, 100);
  }, [startGame]);

  const handleBackToMenu = useCallback(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
    }
    if (gameCanvasRef.current) {
      gameCanvasRef.current.destroy();
      gameCanvasRef.current = null;
    }
    setScreen('menu');
    setGameResult(null);
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setPlayerName(name);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const baseWidth = 800;
      const baseHeight = 600;
      
      let scale = 1;
      if (window.innerWidth < 900) {
        const maxWidth = window.innerWidth * 0.9;
        scale = Math.min(1, maxWidth / baseWidth);
      } else {
        scale = Math.min(1, containerWidth / baseWidth);
      }
      
      canvasScaleRef.current = scale;
      canvasRef.current.style.transform = `scale(${scale})`;
      canvasRef.current.style.transformOrigin = 'center center';
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screen]);

  return (
    <div className="app" ref={containerRef}>
      {screen === 'menu' && (
        <MainMenu
          onStart={startGame}
          playerName={playerName}
          onNameChange={handleNameChange}
        />
      )}

      {screen === 'playing' && (
        <div className="game-wrapper">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="game-canvas"
            />
          </div>
          <GameUI
            onPause={handlePause}
            onResume={handleResume}
            onRestart={handleRestart}
            onBackToMenu={handleBackToMenu}
            isMobile={isMobile}
          />
        </div>
      )}

      {screen === 'gameover' && gameResult && (
        <GameOver
          score={gameResult.score}
          coinsCollected={gameResult.coins}
          survivalTime={gameResult.time}
          playerName={playerName}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;
