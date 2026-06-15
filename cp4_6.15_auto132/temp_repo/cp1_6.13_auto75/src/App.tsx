import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState, TowerType } from './types';
import { Renderer } from './renderer';
import { GameLoop } from './gameLoop';
import { Controller } from './controller';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TOWER_CONFIGS, TOTAL_WAVES,
  getTowerDamage, getTowerRange, getTowerUpgradeCost, getTowerSellValue
} from './config';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const controllerRef = useRef<Controller | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / CANVAS_WIDTH;
      const scaleY = vh / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY) * 0.95);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new Renderer(ctx);
    const gameLoop = new GameLoop(renderer, handleStateChange);
    const controller = new Controller(canvas, gameLoop);

    gameLoopRef.current = gameLoop;
    controllerRef.current = controller;

    setGameState(gameLoop.getState());
    gameLoop.start();

    return () => {
      controller.destroy();
      gameLoop.stop();
    };
  }, [handleStateChange]);

  const handleSelectTowerType = (type: TowerType) => {
    if (!gameLoopRef.current) return;
    const state = gameLoopRef.current.getState();
    if (state.selectedTowerType === type) {
      gameLoopRef.current.selectTowerType(null);
    } else {
      gameLoopRef.current.selectTowerType(type);
    }
  };

  const handleStartWave = () => {
    gameLoopRef.current?.startWave();
  };

  const handleUpgrade = () => {
    if (!gameLoopRef.current || !gameState?.selectedTower) return;
    gameLoopRef.current.tryUpgradeTower(gameState.selectedTower.id);
  };

  const handleSell = () => {
    if (!gameLoopRef.current || !gameState?.selectedTower) return;
    gameLoopRef.current.sellTower(gameState.selectedTower.id);
  };

  const handleRestart = () => {
    gameLoopRef.current?.reset();
  };

  if (!gameState) return null;

  const warningStyle = gameState.warningFlash > 0
    ? { animation: 'warningFlash 0.3s ease' }
    : {};

  const getScore = () => {
    const waveScore = gameState.currentWave * 1000;
    const killScore = gameState.kills * 50;
    const lifeBonus = gameState.lives * 100;
    return waveScore + killScore + lifeBonus;
  };

  const getRating = () => {
    const score = getScore();
    if (score >= 12000) return { stars: 3, text: '完美防御' };
    if (score >= 8000) return { stars: 2, text: '出色表现' };
    if (score >= 4000) return { stars: 1, text: '勉强通过' };
    return { stars: 0, text: '需要练习' };
  };

  return (
    <div className="game-container" style={warningStyle}>
      <div
        className="game-wrapper"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
        />

        <div className="ui-overlay">
          <div className="top-bar">
            <div className="stat-item lives">
              <span className="icon">❤</span>
              <span className="value">{gameState.lives}</span>
              <span className="max">/ {gameState.maxLives}</span>
            </div>
            <div className="stat-item energy">
              <span className="icon">◆</span>
              <span className="value">{gameState.energy}</span>
            </div>
          </div>

          <div className="tower-bar">
            {(Object.keys(TOWER_CONFIGS) as TowerType[]).map(type => {
              const config = TOWER_CONFIGS[type];
              const canAfford = gameState.energy >= config.cost;
              const isSelected = gameState.selectedTowerType === type;
              return (
                <button
                  key={type}
                  className={`tower-btn ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                  onClick={() => canAfford && handleSelectTowerType(type)}
                  style={{ '--tower-color': config.color } as React.CSSProperties}
                >
                  <div className="tower-icon" style={{ background: config.color }}>
                    <span className="tower-gem">◆</span>
                  </div>
                  <div className="tower-info">
                    <span className="tower-name">{config.name}</span>
                    <span className="tower-cost">◆ {config.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="wave-panel">
            {gameState.phase === 'preparing' && (
              <div className="wave-info">
                <div className="wave-label">准备开始</div>
                <button className="start-btn" onClick={handleStartWave}>
                  开始第 1 波
                </button>
              </div>
            )}
            {gameState.phase === 'playing' && (
              <div className="wave-info">
                <div className="wave-label">
                  第 {gameState.currentWave} / {TOTAL_WAVES} 波
                </div>
                <div className="wave-progress">
                  剩余怪物: {gameState.monsters.length + gameState.monstersToSpawn}
                </div>
              </div>
            )}
            {gameState.phase === 'waveComplete' && (
              <div className="wave-info">
                <div className="wave-label">
                  下一波: {gameState.currentWave + 1} / {TOTAL_WAVES}
                </div>
                <div className="wave-countdown">
                  {gameState.waveCountdown.toFixed(1)} 秒
                </div>
                <button className="start-btn" onClick={handleStartWave}>
                  立即开始
                </button>
              </div>
            )}
          </div>

          {gameState.selectedTower && (
            <div className="tower-menu">
              <div className="tower-menu-header">
                <span
                  className="tower-menu-color"
                  style={{ background: TOWER_CONFIGS[gameState.selectedTower.type].color }}
                />
                <span className="tower-menu-name">
                  {TOWER_CONFIGS[gameState.selectedTower.type].name} Lv.{gameState.selectedTower.level}
                </span>
              </div>
              <div className="tower-menu-stats">
                <div>伤害: {getTowerDamage(gameState.selectedTower.type, gameState.selectedTower.level)}</div>
                <div>范围: {getTowerRange(gameState.selectedTower.type, gameState.selectedTower.level).toFixed(1)}</div>
              </div>
              <div className="tower-menu-actions">
                {gameState.selectedTower.level < 3 ? (
                  <button
                    className={`action-btn upgrade ${
                      gameState.energy < (getTowerUpgradeCost(gameState.selectedTower.type, gameState.selectedTower.level) || 0)
                        ? 'disabled' : ''
                    }`}
                    onClick={handleUpgrade}
                  >
                    升级 ◆{getTowerUpgradeCost(gameState.selectedTower.type, gameState.selectedTower.level)}
                  </button>
                ) : (
                  <button className="action-btn upgrade disabled">已满级</button>
                )}
                <button className="action-btn sell" onClick={handleSell}>
                  出售 ◆{getTowerSellValue(gameState.selectedTower.type, gameState.selectedTower.level)}
                </button>
              </div>
            </div>
          )}

          {(gameState.phase === 'gameOver' || gameState.phase === 'victory') && (
            <div className="modal-overlay">
              <div className="modal">
                <h2 className="modal-title">
                  {gameState.phase === 'victory' ? '🎉 胜利！' : '💀 游戏结束'}
                </h2>
                <div className="modal-stats">
                  <div className="stat-row">
                    <span>完成波次</span>
                    <span className="stat-value">{gameState.currentWave} / {TOTAL_WAVES}</span>
                  </div>
                  <div className="stat-row">
                    <span>击杀数量</span>
                    <span className="stat-value">{gameState.kills}</span>
                  </div>
                  <div className="stat-row">
                    <span>剩余生命</span>
                    <span className="stat-value">{gameState.lives}</span>
                  </div>
                  <div className="stat-row total">
                    <span>总评分</span>
                    <span className="stat-value score">{getScore()}</span>
                  </div>
                  <div className="rating">
                    <span className="stars">{'★'.repeat(getRating().stars)}{'☆'.repeat(3 - getRating().stars)}</span>
                    <span className="rating-text">{getRating().text}</span>
                  </div>
                </div>
                <button className="restart-btn" onClick={handleRestart}>
                  重新开始
                </button>
              </div>
            </div>
          )}

          {gameState.phase === 'preparing' && gameState.currentWave === 0 && (
            <div className="modal-overlay">
              <div className="modal start-modal">
                <h2 className="modal-title">
                  <span className="title-icon">💎</span>
                  CrystalSiege
                </h2>
                <p className="modal-subtitle">水晶围城</p>
                <div className="wave-start-info">
                  <div>共 <strong>{TOTAL_WAVES}</strong> 波敌人</div>
                  <div>初始生命: <strong>{gameState.maxLives}</strong></div>
                  <div>初始能量: <strong>{gameState.energy}</strong></div>
                </div>
                <div className="tower-preview">
                  {(Object.keys(TOWER_CONFIGS) as TowerType[]).map(type => {
                    const config = TOWER_CONFIGS[type];
                    return (
                      <div key={type} className="tower-preview-item" style={{ '--tower-color': config.color } as React.CSSProperties}>
                        <div className="preview-icon" style={{ background: config.color }}>◆</div>
                        <span className="preview-name">{config.name}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="restart-btn" onClick={handleStartWave}>
                  开始游戏
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
