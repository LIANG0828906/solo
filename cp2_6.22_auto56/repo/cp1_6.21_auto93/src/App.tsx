import { useState, useEffect, useRef, useCallback } from 'react';
import { LevelManager } from './LevelManager';
import { TowerDefenseGame } from './TowerDefenseGame';
import type { GameState, Tower, TowerType } from './types';
import { TOWER_CONFIGS, HEX_SIZE, ENEMY_CONFIGS } from './types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TowerDefenseGame | null>(null);
  const levelManagerRef = useRef<LevelManager | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [scorePop, setScorePop] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [upgradePanelPos, setUpgradePanelPos] = useState<{ x: number; y: number } | null>(null);
  const starsRef = useRef<{ x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    starsRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3
    }));
  }, []);

  useEffect(() => {
    const initGame = async () => {
      const levelManager = new LevelManager();
      levelManagerRef.current = levelManager;
      
      try {
        await levelManager.loadLevel('level-1');
        const game = new TowerDefenseGame(levelManager);
        gameRef.current = game;
        
        game.on('stateChange', (state: GameState) => {
          setGameState({ ...state });
        });
        
        game.on('scoreChanged', () => {
          setScorePop(true);
          setTimeout(() => setScorePop(false), 300);
        });
        
        game.on('gameOver', () => {
          game.stop();
        });
        
        setGameState(game.getState());
        setIsLoading(false);
      } catch (error) {
        console.error('初始化游戏失败:', error);
        setIsLoading(false);
      }
    };
    
    initGame();
    
    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!gameState || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawHexGrid(ctx);
      drawPath(ctx);
      drawBase(ctx);
      drawTowers(ctx, gameState);
      drawEnemies(ctx, gameState);
      drawProjectiles(ctx, gameState);
      drawParticles(ctx, gameState);
      
      if (gameState.selectedTower) {
        drawTowerRange(ctx, gameState.selectedTower);
      }
    };
    
    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);

  const drawHexGrid = (ctx: CanvasRenderingContext2D) => {
    const levelManager = levelManagerRef.current;
    if (!levelManager) return;
    
    const { cols, rows } = levelManager.getGridSize();
    
    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const pos = LevelManager.hexToPixel(gx, gy, HEX_SIZE);
        
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = pos.x + HEX_SIZE * Math.cos(angle);
          const hy = pos.y + HEX_SIZE * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(hx, hy);
          } else {
            ctx.lineTo(hx, hy);
          }
        }
        ctx.closePath();
        
        if (levelManager.isOnPath(gx, gy, HEX_SIZE)) {
          ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        } else {
          ctx.fillStyle = 'rgba(31, 40, 51, 0.5)';
        }
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(69, 162, 158, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
      }
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D) => {
    const levelManager = levelManagerRef.current;
    if (!levelManager) return;
    
    const path = levelManager.getPath();
    if (path.length < 2) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.restore();
  };

  const drawBase = (ctx: CanvasRenderingContext2D) => {
    const levelManager = levelManagerRef.current;
    if (!levelManager) return;
    
    const path = levelManager.getPath();
    if (path.length < 1) return;
    
    const endPos = path[path.length - 1];
    
    ctx.save();
    
    const gradient = ctx.createRadialGradient(endPos.x, endPos.y, 0, endPos.x, endPos.y, 35);
    gradient.addColorStop(0, 'rgba(102, 252, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(102, 252, 241, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(endPos.x, endPos.y, 35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#66FCF1';
    ctx.beginPath();
    ctx.arc(endPos.x, endPos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0B0C10';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('基', endPos.x, endPos.y);
    
    ctx.restore();
  };

  const drawTowers = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const time = performance.now() / 1000;
    
    for (const tower of state.towers) {
      const config = TOWER_CONFIGS[tower.type];
      const isSelected = state.selectedTower?.id === tower.id;
      
      ctx.save();
      ctx.translate(tower.x, tower.y);
      
      const pulseScale = 1 + Math.sin(time * 3) * 0.05;
      ctx.scale(pulseScale, pulseScale);
      
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 15;
      
      ctx.fillStyle = config.color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = 16 * Math.cos(angle);
        const hy = 16 * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0B0C10';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      
      if (tower.level > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tower.level.toString(), 0, 0);
      }
      
      if (isSelected) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  };

  const drawTowerRange = (ctx: CanvasRenderingContext2D, tower: Tower) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(102, 252, 241, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(102, 252, 241, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawEnemies = (ctx: CanvasRenderingContext2D, state: GameState) => {
    for (const enemy of state.enemies) {
      const config = ENEMY_CONFIGS[enemy.type];
      
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      if (enemy.slowEffect > 0) {
        ctx.shadowColor = '#4ECDC4';
        ctx.shadowBlur = 10;
      }
      
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      const healthPercent = enemy.health / enemy.maxHealth;
      const barWidth = 24;
      const barHeight = 3;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-barWidth / 2, -18, barWidth, barHeight);
      
      const healthColor = healthPercent > 0.5 ? '#10B981' : healthPercent > 0.25 ? '#F59E0B' : '#EF4444';
      ctx.fillStyle = healthColor;
      ctx.fillRect(-barWidth / 2, -18, barWidth * healthPercent, barHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(enemy.health).toString(), 0, -22);
      
      ctx.restore();
    }
  };

  const drawProjectiles = (ctx: CanvasRenderingContext2D, state: GameState) => {
    for (const proj of state.projectiles) {
      const config = TOWER_CONFIGS[proj.type];
      
      ctx.save();
      ctx.fillStyle = config.color;
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, state: GameState) => {
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (!game || !canvas || !gameState) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Canvas clicked at:', x, y);
    console.log('Selected tower type:', gameState.selectedTowerType);
    
    const clickedTower = gameState.towers.find(tower => {
      const dx = tower.x - x;
      const dy = tower.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });
    
    if (clickedTower) {
      game.selectTower(clickedTower);
      setUpgradePanelPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (gameState.selectedTowerType) {
      const { gridX, gridY } = LevelManager.pixelToHex(x, y, HEX_SIZE);
      const levelManager = levelManagerRef.current;
      
      if (levelManager) {
        const { cols, rows } = levelManager.getGridSize();
        if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
          game.placeTower(gridX, gridY, gameState.selectedTowerType);
        }
      }
    }
    
    game.selectTower(null);
    setUpgradePanelPos(null);
  }, [gameState]);

  const handleTowerSelect = useCallback((type: TowerType) => {
    const game = gameRef.current;
    if (!game) return;
    
    const currentType = game.getState().selectedTowerType;
    game.selectTowerType(currentType === type ? null : type);
    game.selectTower(null);
    setUpgradePanelPos(null);
  }, []);

  const handleStartGame = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    
    game.start();
    game.startGame();
    setGameStarted(true);
  }, []);

  const handleUpgradeTower = useCallback(() => {
    const game = gameRef.current;
    if (!game || !gameState?.selectedTower) return;
    
    game.upgradeTower(gameState.selectedTower.id);
  }, [gameState]);

  const handleSaveRecord = useCallback(async () => {
    if (!gameState || savingRecord) return;
    
    setSavingRecord(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerName: '玩家',
          score: gameState.score,
          kills: gameState.kills,
          remainingLives: gameState.lives,
          levelId: 'level-1'
        })
      });
      
      if (response.ok) {
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('保存战绩失败:', error);
    } finally {
      setSavingRecord(false);
    }
  }, [gameState, savingRecord]);

  const handleRestart = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    
    game.reset();
    game.start();
    game.startGame();
    setGameStarted(true);
    setSaveSuccess(false);
    setUpgradePanelPos(null);
  }, []);

  const getWaveProgress = () => {
    if (!gameState) return 0;
    
    if (gameState.phase === 'waveEnd') {
      return (1 - gameState.waveCountdown / 5) * 100;
    }
    
    if (gameState.phase === 'wave') {
      const levelManager = levelManagerRef.current;
      if (!levelManager) return 0;
      
      const spawnInfo = levelManager.generateEnemySpawnInfo(gameState.currentWave);
      const totalEnemies = spawnInfo.length;
      const killedEnemies = gameState.kills;
      
      return Math.min(100, (killedEnemies / totalEnemies) * 100);
    }
    
    return 0;
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="star-field">
          {starsRef.current.map((star, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay}s`
              }}
            />
          ))}
        </div>
        <div className="start-screen">
          <h1>星链塔防</h1>
          <p className="subtitle">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="star-field">
        {starsRef.current.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>

      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          className="game-canvas"
          onClick={handleCanvasClick}
        />
        
        {gameStarted && gameState && (
          <>
            <div className="top-bar">
              <div className="wave-info">
                第 {gameState.currentWave} / {gameState.totalWaves} 波
              </div>
              <div className="wave-progress">
                <div
                  className="wave-progress-bar"
                  style={{ width: `${getWaveProgress()}%` }}
                />
              </div>
              {gameState.phase === 'waveEnd' && (
                <div className="wave-countdown">
                  下一波: {Math.ceil(gameState.waveCountdown)}s
                </div>
              )}
            </div>

            <div className="score-display">
              <div className="score-label">积分</div>
              <div className={`score-value ${scorePop ? 'pop' : ''}`}>
                {gameState.score}
              </div>
            </div>

            <div className="lives-display">
              <div className="lives-label">生命</div>
              <div className="lives-value">
                {'❤️'.repeat(Math.max(0, gameState.lives))}
              </div>
            </div>

            <div className="tower-panel">
              <button
                className={`tower-btn laser ${gameState.selectedTowerType === 'laser' ? 'selected' : ''}`}
                onClick={() => handleTowerSelect('laser')}
                title="激光塔"
              >
                L
                <span className="cost">{TOWER_CONFIGS.laser.cost}</span>
              </button>
              <button
                className={`tower-btn cannon ${gameState.selectedTowerType === 'cannon' ? 'selected' : ''}`}
                onClick={() => handleTowerSelect('cannon')}
                title="火炮塔"
              >
                C
                <span className="cost">{TOWER_CONFIGS.cannon.cost}</span>
              </button>
              <button
                className={`tower-btn freeze ${gameState.selectedTowerType === 'freeze' ? 'selected' : ''}`}
                onClick={() => handleTowerSelect('freeze')}
                title="冰冻塔"
              >
                F
                <span className="cost">{TOWER_CONFIGS.freeze.cost}</span>
              </button>
            </div>

            <div className="hex-grid-hint">
              选择塔类型，点击空白格子放置 | 点击已放置的塔可升级
            </div>
          </>
        )}

        {upgradePanelPos && gameState?.selectedTower && (
          <div
            className="upgrade-panel"
            style={{
              left: `${upgradePanelPos.x + 10}px`,
              top: `${upgradePanelPos.y - 80}px`
            }}
          >
            <h3>{TOWER_CONFIGS[gameState.selectedTower.type].name} Lv.{gameState.selectedTower.level}</h3>
            <div className="stat">伤害: {Math.round(gameState.selectedTower.damage)}</div>
            <div className="stat">射程: {Math.round(gameState.selectedTower.range)}</div>
            <button
              className="upgrade-btn"
              onClick={handleUpgradeTower}
              disabled={gameState.score < TOWER_CONFIGS[gameState.selectedTower.type].upgradeCost || gameState.selectedTower.level >= 5}
            >
              升级 ({TOWER_CONFIGS[gameState.selectedTower.type].upgradeCost}分)
            </button>
          </div>
        )}

        {!gameStarted && (
          <div className="start-screen">
            <h1>星链塔防</h1>
            <p className="subtitle">STARLINK TOWER DEFENSE</p>
            <button className="start-btn" onClick={handleStartGame}>
              开始游戏
            </button>
          </div>
        )}

        {(gameState?.phase === 'victory' || gameState?.phase === 'defeat') && (
          <div className="result-overlay">
            <div className={`result-card ${gameState.phase}`}>
              <h2>
                {gameState.phase === 'victory' ? '🎉 胜利！' : '💀 失败'}
              </h2>
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-stat-label">最终得分</span>
                  <span className="result-stat-value">{gameState.score}</span>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">击败敌人</span>
                  <span className="result-stat-value">{gameState.kills}</span>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">剩余生命</span>
                  <span className="result-stat-value">{gameState.lives}</span>
                </div>
              </div>
              <button
                className="save-btn"
                onClick={handleSaveRecord}
                disabled={savingRecord || saveSuccess}
              >
                {savingRecord ? (
                  <>
                    <div className="spinner" />
                    保存中...
                  </>
                ) : saveSuccess ? (
                  '✓ 已保存'
                ) : (
                  '保存战绩'
                )}
              </button>
              {saveSuccess && (
                <div className="save-success">战绩保存成功！</div>
              )}
              <button
                className="upgrade-btn"
                style={{ marginTop: '12px' }}
                onClick={handleRestart}
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
