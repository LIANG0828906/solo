import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from '@/components/GameBoard';
import Customizer from '@/components/Customizer';
import type { Theme, ThemeTile } from '@/data/themes';
import { DEFAULT_THEME } from '@/data/themes';
import type { Tile, Point, Difficulty } from '@/utils/matching';
import { generateBoard, DIFFICULTY_CONFIG } from '@/utils/matching';
import './App.css';

const GAME_DURATION = 300;
const BASE_SCORE = 100;
const COMBO_BONUS = 50;

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
  const [customTiles, setCustomTiles] = useState<ThemeTile[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [themeTransitionKey, setThemeTransitionKey] = useState(0);

  const timerRef = useRef<number | null>(null);

  const initGame = useCallback(() => {
    const tileSource = currentTheme.tiles.length > 0 ? currentTheme.tiles : DEFAULT_THEME.tiles;
    const newBoard = generateBoard(tileSource, difficulty);
    setTiles(newBoard);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setIsPlaying(true);
    setThemeTransitionKey((prev) => prev + 1);
  }, [currentTheme, difficulty]);

  const startGame = useCallback(() => {
    initGame();
  }, [initGame]);

  const pauseGame = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeGame = useCallback(() => {
    setIsPaused(false);
  }, []);

  const restartGame = useCallback(() => {
    initGame();
  }, [initGame]);

  const handleMatchSuccess = useCallback(
    (_tile1: Tile, _tile2: Tile, _path: Point[]) => {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === _tile1.id || t.id === _tile2.id ? { ...t, matched: true } : t
        )
      );

      setCombo((prevCombo) => {
        const newCombo = prevCombo + 1;
        const points = BASE_SCORE + (newCombo - 1) * COMBO_BONUS;
        setScore((prevScore) => prevScore + points);
        return newCombo;
      });
    },
    []
  );

  const handleMatchFail = useCallback(() => {
    setCombo(0);
  }, []);

  useEffect(() => {
    if (tiles.length === 0) return;

    const themeTiles = currentTheme.tiles;
    if (themeTiles.length === 0) return;

    setTiles((prevTiles) =>
      prevTiles.map((tile) => {
        const newTileData = themeTiles[tile.tileIndex % themeTiles.length];
        if (newTileData && newTileData.id !== tile.tileId) {
          return {
            ...tile,
            tileId: newTileData.id,
            tileData: newTileData,
          };
        }
        return tile;
      })
    );
    setThemeTransitionKey((prev) => prev + 1);
  }, [currentTheme]);

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          setIsVictory(false);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, isGameOver]);

  useEffect(() => {
    if (isPlaying && tiles.length > 0) {
      const allMatched = tiles.every((t) => t.matched);
      if (allMatched) {
        setIsGameOver(true);
        setIsVictory(true);
        setIsPlaying(false);
      }
    }
  }, [tiles, isPlaying]);

  const handleSelectPreset = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    setThemeTransitionKey((prev) => prev + 1);
  }, []);

  const handleUpdateCustomTiles = useCallback((newCustomTiles: ThemeTile[]) => {
    setCustomTiles(newCustomTiles);
  }, []);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    if (isPlaying && !isPaused) {
      setIsPaused(true);
    }
    setDifficulty(newDifficulty);
  }, [isPlaying, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTiles = tiles.filter((t) => !t.matched).length;
  const isLast30Seconds = timeLeft <= 30 && timeLeft > 0;

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="app">
      <div className="stars-bg">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
            }}
          />
        ))}
      </div>

      <div className="top-bar">
        <button
          className="menu-btn"
          onClick={() => setIsCustomizerOpen(true)}
          title="主题定制"
        >
          🎨
        </button>

        <div className="stats-container">
          <div className={`stat-item time-stat ${isLast30Seconds ? 'time-warning' : ''}`}>
            <span className="stat-label">时间</span>
            <span className="stat-value">{formatTime(timeLeft)}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">得分</span>
            <span className="stat-value score-value">{score}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">连击</span>
            <span className={`stat-value combo-value ${combo > 0 ? 'combo-active' : ''}`}>
              {combo > 0 ? `x${combo}` : '-'}
            </span>
          </div>
        </div>

        <div className="difficulty-indicator" title={`${config.label}模式`}>
          <div className="difficulty-slider">
            <div
              className={`difficulty-icon ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('easy')}
            >
              🤖
            </div>
            <div
              className={`difficulty-icon ${difficulty === 'normal' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('normal')}
            >
              💀
            </div>
          </div>
          <span className="difficulty-label">{config.label}</span>
        </div>
      </div>

      <div className="game-container">
        <div className="game-title">
          <h1>连连看</h1>
          <p className="theme-name" key={themeTransitionKey}>
            {currentTheme.name}
          </p>
        </div>

        {!isPlaying && !isGameOver ? (
          <div className="start-screen">
            <div className="start-content">
              <div className="game-logo">🎮</div>
              <h2>准备好了吗？</h2>
              <p className="start-desc">
                点击两个相同的图块，路径转折不超过两次即可消除
              </p>
              <button className="start-btn" onClick={startGame}>
                开始游戏
              </button>
            </div>
          </div>
        ) : (
          <GameBoard
            key={themeTransitionKey}
            tiles={tiles}
            difficulty={difficulty}
            isPaused={isPaused}
            isGameOver={isGameOver}
            isVictory={isVictory}
            onMatchSuccess={handleMatchSuccess}
            onMatchFail={handleMatchFail}
          />
        )}

        <div className="bottom-controls">
          {isPlaying && !isPaused && !isGameOver && (
            <button className="control-btn pause-btn" onClick={pauseGame}>
              ⏸️ 暂停
            </button>
          )}

          {isPaused && (
            <div className="paused-overlay">
              <div className="paused-content">
                <h3>游戏暂停</h3>
                <button className="control-btn" onClick={resumeGame}>
                  ▶️ 继续
                </button>
              </div>
            </div>
          )}

          {isGameOver && (
            <div className="game-over-panel">
              <h3>{isVictory ? '🎉 恭喜通关！' : '⏰ 时间到！'}</h3>
              <p>最终得分：{score}</p>
              {isVictory && <p>剩余时间：{formatTime(timeLeft)}</p>}
              <button className="control-btn retry-btn" onClick={restartGame}>
                🔄 再来一局
              </button>
            </div>
          )}
        </div>

        <div className="remaining-info">
          剩余图块：{remainingTiles} / {tiles.length || config.gridSize * config.gridSize}
        </div>
      </div>

      <Customizer
        isOpen={isCustomizerOpen}
        currentThemeId={currentTheme.id}
        customTiles={customTiles}
        onClose={() => setIsCustomizerOpen(false)}
        onSelectPreset={handleSelectPreset}
        onUpdateCustomTiles={handleUpdateCustomTiles}
      />
    </div>
  );
};

export default App;
