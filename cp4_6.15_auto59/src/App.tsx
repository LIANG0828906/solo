import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import {
  createInitialState,
  updateGame,
  loadLevel,
  InputState,
  saveCustomLevel,
  loadCustomLevel,
  createEmptyLevel,
} from './gameEngine';
import { GameState, LevelData, EditorTool } from './types';
import {
  levels,
  CANVAS_WIDTH,
  PLATFORM_HEIGHT,
  COIN_RADIUS,
  SPIKE_SIZE,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  INITIAL_LIVES,
} from './levels';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  });
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [editingLevel, setEditingLevel] = useState<LevelData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number>(-1);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);

  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.67, 2);
    lastTimeRef.current = timestamp;

    setGameState((prevState) => {
      const input = { ...inputRef.current };
      const newState = updateGame(prevState, input, deltaTime);
      inputRef.current.jumpPressed = false;
      return newState;
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.gameStatus, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          inputRef.current.left = true;
          break;
        case 'd':
        case 'arrowright':
          inputRef.current.right = true;
          break;
        case ' ':
          e.preventDefault();
          if (!inputRef.current.jump) {
            inputRef.current.jump = true;
            inputRef.current.jumpPressed = true;
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          inputRef.current.left = false;
          break;
        case 'd':
        case 'arrowright':
          inputRef.current.right = false;
          break;
        case ' ':
          inputRef.current.jump = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameStatus]);

  const handleStartGame = (levelIndex: number) => {
    setGameState((prev) => {
      const newState = loadLevel({ ...prev, customLevel: null }, levelIndex);
      return { ...newState, score: 0, lives: INITIAL_LIVES };
    });
  };

  const handleRestart = () => {
    setGameState((prev) => {
      const newState = loadLevel(prev, prev.level);
      return { ...newState, score: 0, lives: INITIAL_LIVES };
    });
  };

  const handleNextLevel = () => {
    setGameState((prev) => {
      const nextLevel = prev.level + 1;
      if (nextLevel < levels.length) {
        const newState = loadLevel(prev, nextLevel);
        return newState;
      }
      return prev;
    });
  };

  const handleBackToMenu = () => {
    setGameState(createInitialState());
    setEditingLevel(null);
  };

  const handleEditorMode = () => {
    const emptyLevel = createEmptyLevel();
    setEditingLevel(emptyLevel);
    setGameState((prev) => ({
      ...prev,
      gameStatus: 'editor',
      platforms: emptyLevel.platforms,
      coins: emptyLevel.coins,
      spikes: emptyLevel.spikes,
      goal: emptyLevel.goal,
    }));
  };

  const handleSelectTool = (tool: EditorTool | null) => {
    setGameState((prev) => ({ ...prev, selectedTool: tool }));
  };

  const handleSaveLevel = () => {
    if (editingLevel) {
      saveCustomLevel(editingLevel);
      alert('关卡已保存！');
    }
  };

  const handleLoadLevel = () => {
    const saved = loadCustomLevel();
    if (saved) {
      setEditingLevel(saved);
      setGameState((prev) => ({
        ...prev,
        platforms: saved.platforms,
        coins: saved.coins,
        spikes: saved.spikes,
        goal: saved.goal,
      }));
    } else {
      alert('没有找到保存的关卡！');
    }
  };

  const handlePlayCustomLevel = () => {
    if (editingLevel) {
      setGameState((prev) => {
        const newState = loadLevel(
          { ...prev, customLevel: editingLevel },
          prev.level
        );
        return { ...newState, score: 0, lives: INITIAL_LIVES };
      });
    }
  };

  const handleClearLevel = () => {
    const emptyLevel = createEmptyLevel();
    setEditingLevel(emptyLevel);
    setGameState((prev) => ({
      ...prev,
      platforms: emptyLevel.platforms,
      coins: emptyLevel.coins,
      spikes: emptyLevel.spikes,
      goal: emptyLevel.goal,
    }));
  };

  const findElementAt = (x: number, y: number): { type: string; index: number; part: string } | null => {
    if (!editingLevel) return null;

    for (let i = editingLevel.platforms.length - 1; i >= 0; i--) {
      const p = editingLevel.platforms[i];
      if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) {
        if (x >= p.x + p.width - 10 && y >= p.y + p.height - 10) {
          return { type: 'platform', index: i, part: 'resize' };
        }
        return { type: 'platform', index: i, part: 'move' };
      }
    }

    for (let i = editingLevel.coins.length - 1; i >= 0; i--) {
      const c = editingLevel.coins[i];
      const dx = x - c.x;
      const dy = y - c.y;
      if (Math.sqrt(dx * dx + dy * dy) <= c.radius) {
        return { type: 'coin', index: i, part: 'move' };
      }
    }

    for (let i = editingLevel.spikes.length - 1; i >= 0; i--) {
      const s = editingLevel.spikes[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return { type: 'spike', index: i, part: 'move' };
      }
    }

    const g = editingLevel.goal;
    if (x >= g.x && x <= g.x + g.width && y >= g.y && y <= g.y + g.height) {
      return { type: 'goal', index: 0, part: 'move' };
    }

    return null;
  };

  const handleMouseDown = (x: number, y: number) => {
    if (!editingLevel || gameState.selectedTool) {
      if (gameState.selectedTool && editingLevel) {
        const tool = gameState.selectedTool;
        let newLevel = { ...editingLevel };

        switch (tool) {
          case 'platform':
            newLevel = {
              ...newLevel,
              platforms: [
                ...newLevel.platforms,
                { x: x - 30, y, width: 60, height: PLATFORM_HEIGHT },
              ],
            };
            break;
          case 'coin':
            newLevel = {
              ...newLevel,
              coins: [
                ...newLevel.coins,
                { x, y, radius: COIN_RADIUS, collected: false, floatOffset: Math.random() * Math.PI * 2, collectAnimation: 0 },
              ],
            };
            break;
          case 'spike':
            newLevel = {
              ...newLevel,
              spikes: [
                ...newLevel.spikes,
                { x: x - SPIKE_SIZE / 2, y: y - SPIKE_SIZE / 2, width: SPIKE_SIZE, height: SPIKE_SIZE },
              ],
            };
            break;
          case 'goal':
            newLevel = {
              ...newLevel,
              goal: { x: x - GOAL_WIDTH / 2, y: y - GOAL_HEIGHT / 2, width: GOAL_WIDTH, height: GOAL_HEIGHT },
            };
            break;
        }

        setEditingLevel(newLevel);
        setGameState((prev) => ({
          ...prev,
          platforms: newLevel.platforms,
          coins: newLevel.coins,
          spikes: newLevel.spikes,
          goal: newLevel.goal,
        }));
      }
      return;
    }

    const element = findElementAt(x, y);
    if (element) {
      setIsDragging(true);
      setDragStart({ x, y });
      setDraggedIndex(element.index);
      setDragType(element.part === 'resize' ? 'resize' : 'move');

      if (element.type === 'platform' && element.part === 'move') {
        setDragType('move');
      }
    }
  };

  const handleMouseMove = (x: number, y: number) => {
    if (!isDragging || !editingLevel || !dragStart || draggedIndex < 0) return;

    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    let newLevel = { ...editingLevel };
    const element = findElementAt(dragStart.x, dragStart.y);

    if (!element) return;

    switch (element.type) {
      case 'platform':
        newLevel.platforms = [...newLevel.platforms];
        if (dragType === 'move') {
          newLevel.platforms[draggedIndex] = {
            ...newLevel.platforms[draggedIndex],
            x: newLevel.platforms[draggedIndex].x + dx,
            y: newLevel.platforms[draggedIndex].y + dy,
          };
        } else if (dragType === 'resize') {
          const newWidth = Math.max(30, newLevel.platforms[draggedIndex].width + dx);
          const newHeight = Math.max(10, newLevel.platforms[draggedIndex].height + dy);
          newLevel.platforms[draggedIndex] = {
            ...newLevel.platforms[draggedIndex],
            width: newWidth,
            height: newHeight,
          };
        }
        break;
      case 'coin':
        newLevel.coins = [...newLevel.coins];
        newLevel.coins[draggedIndex] = {
          ...newLevel.coins[draggedIndex],
          x: newLevel.coins[draggedIndex].x + dx,
          y: newLevel.coins[draggedIndex].y + dy,
        };
        break;
      case 'spike':
        newLevel.spikes = [...newLevel.spikes];
        newLevel.spikes[draggedIndex] = {
          ...newLevel.spikes[draggedIndex],
          x: newLevel.spikes[draggedIndex].x + dx,
          y: newLevel.spikes[draggedIndex].y + dy,
        };
        break;
      case 'goal':
        newLevel.goal = {
          ...newLevel.goal,
          x: newLevel.goal.x + dx,
          y: newLevel.goal.y + dy,
        };
        break;
    }

    setEditingLevel(newLevel);
    setGameState((prev) => ({
      ...prev,
      platforms: newLevel.platforms,
      coins: newLevel.coins,
      spikes: newLevel.spikes,
      goal: newLevel.goal,
    }));
    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDraggedIndex(-1);
    setDragType(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          fontFamily: "'Press Start 2P', cursive",
          color: '#ff6b35',
          fontSize: '20px',
          marginBottom: '20px',
          textShadow: '3px 3px 0px #000',
        }}
      >
        像素平台跳跃
      </h1>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
        }}
      >
        <GameCanvas
          gameState={gameState}
          isEditor={gameState.gameStatus === 'editor'}
          selectedTool={gameState.selectedTool}
          editingLevel={editingLevel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        <GameUI
          gameState={gameState}
          onStartGame={handleStartGame}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          onBackToMenu={handleBackToMenu}
          onEditorMode={handleEditorMode}
          onSelectTool={handleSelectTool}
          onSaveLevel={handleSaveLevel}
          onLoadLevel={handleLoadLevel}
          onPlayCustomLevel={handlePlayCustomLevel}
          onClearLevel={handleClearLevel}
        />
      </div>

      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          color: '#666',
          fontSize: '8px',
          marginTop: '20px',
        }}
      >
        提示: A/D 或 ←/→ 移动, 空格键跳跃
      </p>
    </div>
  );
};

export default App;
