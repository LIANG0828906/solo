import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore, TowerType, getTowerCost, getTowerUpgradeCost, Tower, Enemy, Projectile, Particle } from './GameEngine';
import { GRID_SIZE, Cell } from './MapGenerator';

const CELL_COLORS = {
  path: '#A0A0A0',
  obstacle: '#2D2D44',
  empty: '#D4E8D4',
};

const TOWER_COLORS: Record<TowerType, string> = {
  cannon: '#FFD700',
  ice: '#87CEEB',
  poison: '#32CD32',
};

const TOWER_LABELS: Record<TowerType, string> = {
  cannon: '炮',
  ice: '冰',
  poison: '毒',
};

export const HUD: React.FC = () => {
  const { lives, gold, wave, maxWaves, waveInProgress, waveTimer, startNextWave, initializeGame, gameOver, victory } = useGameStore();

  const formatTime = (ms: number) => {
    return Math.ceil(ms / 1000).toString();
  };

  return (
    <div className="hud-container">
      <div className="hud-item">
        <span className="hud-label">生命值</span>
        <span className="hud-value lives">{lives}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">金币</span>
        <span className="hud-value gold">{gold}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">波次</span>
        <span className="hud-value wave">{wave} / {maxWaves}</span>
      </div>
      {!waveInProgress && !gameOver && !victory && wave < maxWaves && (
        <div className="hud-item">
          <span className="hud-label">下一波</span>
          <span className="hud-value timer">{formatTime(waveTimer)}s</span>
        </div>
      )}
      {!waveInProgress && !gameOver && !victory && wave < maxWaves && (
        <button className="start-wave-btn" onClick={startNextWave}>
          开始第 {wave + 1} 波
        </button>
      )}
      {(gameOver || victory) && (
        <button className="restart-btn" onClick={initializeGame}>
          重新开始
        </button>
      )}

      <style>{`
        .hud-container {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: rgba(26, 26, 46, 0.9);
          border: 2px solid #00ABB3;
          border-radius: 8px;
          box-shadow: 0 0 20px rgba(0, 171, 179, 0.3);
          font-family: 'Roboto Mono', monospace;
          z-index: 100;
        }
        .hud-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .hud-label {
          font-size: 14px;
          color: #888;
        }
        .hud-value {
          font-size: 14px;
          font-weight: bold;
        }
        .hud-value.lives {
          color: #FF4444;
        }
        .hud-value.gold {
          color: #FFD700;
        }
        .hud-value.wave {
          color: #00ABB3;
        }
        .hud-value.timer {
          color: #FFA500;
        }
        .start-wave-btn, .restart-btn {
          margin-top: 8px;
          padding: 10px 16px;
          background: #00ABB3;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s ease-in-out;
        }
        .start-wave-btn:hover, .restart-btn:hover {
          background: #008A92;
        }
        .start-wave-btn:active, .restart-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export const BuildMenu: React.FC<{ x: number; y: number; cellSize: number; offsetX: number; offsetY: number }> = ({ x, y, cellSize, offsetX, offsetY }) => {
  const { buildTower, gold, deselectCell } = useGameStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const towerTypes: TowerType[] = ['cannon', 'ice', 'poison'];

  const handleBuild = (type: TowerType) => {
    const cost = getTowerCost(type);
    if (gold >= cost) {
      buildTower(type);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        deselectCell();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deselectCell]);

  const centerX = offsetX + x * cellSize + cellSize / 2;
  const centerY = offsetY + y * cellSize + cellSize / 2;

  return (
    <div
      ref={menuRef}
      className="build-menu"
      style={{
        left: centerX,
        top: centerY - 50,
      }}
    >
      {towerTypes.map((type, index) => {
        const cost = getTowerCost(type);
        const canAfford = gold >= cost;
        const angle = (index - 1) * (Math.PI / 3);
        const radius = 50;
        const btnX = Math.cos(angle) * radius - 15;
        const btnY = Math.sin(angle) * radius - 15;

        return (
          <div
            key={type}
            className={`tower-btn ${!canAfford ? 'disabled' : ''}`}
            style={{
              left: btnX,
              top: btnY,
              backgroundColor: canAfford ? TOWER_COLORS[type] : '#555',
            }}
            onClick={() => canAfford && handleBuild(type)}
            title={`${TOWER_LABELS[type]}塔 - ${cost}金币`}
          >
            <span className="tower-icon">{TOWER_LABELS[type]}</span>
            <span className="tower-cost">{cost}</span>
          </div>
        );
      })}

      <style>{`
        .build-menu {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
          z-index: 200;
        }
        .tower-btn {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.69);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .tower-btn:hover:not(.disabled) {
          transform: scale(1.15);
        }
        .tower-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .tower-icon {
          font-size: 12px;
          font-weight: bold;
          color: #1A1A2E;
          line-height: 1;
        }
        .tower-cost {
          font-size: 8px;
          color: #1A1A2E;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export const UpgradePanel: React.FC = () => {
  const { towers, selectedTower, gold, upgradeTower, deselectCell } = useGameStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const tower = towers.find(t => t.id === selectedTower);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        deselectCell();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deselectCell]);

  if (!tower) return null;

  const upgradeCost = getTowerUpgradeCost(tower);
  const canUpgrade = tower.level < 3 && gold >= upgradeCost;
  const isMaxLevel = tower.level >= 3;

  return (
    <div className="upgrade-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="tower-name" style={{ color: TOWER_COLORS[tower.type] }}>
          {TOWER_LABELS[tower.type]}塔 Lv.{tower.level}
        </span>
      </div>
      <div className="panel-stats">
        <div className="stat-row">
          <span>攻击</span>
          <span>{tower.attack}</span>
        </div>
        <div className="stat-row">
          <span>射程</span>
          <span>{tower.range}</span>
        </div>
        <div className="stat-row">
          <span>攻速</span>
          <span>{tower.attackSpeed}/秒</span>
        </div>
      </div>
      {!isMaxLevel && (
        <button
          className={`upgrade-btn ${!canUpgrade ? 'disabled' : ''}`}
          onClick={() => canUpgrade && upgradeTower(tower.id)}
        >
          升级 ({upgradeCost}金币)
        </button>
      )}
      {isMaxLevel && (
        <div className="max-level">已满级</div>
      )}

      <style>{`
        .upgrade-panel {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 200px;
          padding: 16px;
          background: rgba(26, 26, 46, 0.95);
          border: 2px solid #00ABB3;
          border-radius: 8px;
          box-shadow: 0 0 20px rgba(0, 171, 179, 0.3);
          font-family: 'Roboto Mono', monospace;
          z-index: 150;
        }
        .panel-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 171, 179, 0.3);
        }
        .tower-name {
          font-size: 16px;
          font-weight: bold;
        }
        .panel-stats {
          margin-bottom: 16px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #CCC;
        }
        .upgrade-btn {
          width: 100%;
          padding: 10px;
          background: #00ABB3;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s ease-in-out;
        }
        .upgrade-btn:hover:not(.disabled) {
          background: #008A92;
        }
        .upgrade-btn.disabled {
          background: #555;
          cursor: not-allowed;
        }
        .max-level {
          text-align: center;
          padding: 10px;
          color: #FFD700;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export const GameOverOverlay: React.FC = () => {
  const { gameOver, victory, initializeGame } = useGameStore();

  if (!gameOver && !victory) return null;

  return (
    <div className="overlay">
      <div className="overlay-content">
        <h1 className={victory ? 'victory' : 'game-over'}>
          {victory ? '🎉 胜利！' : '💀 游戏结束'}
        </h1>
        <p className="overlay-text">
          {victory ? '恭喜你成功抵御了所有波次的敌人！' : '敌人突破了你的防线...'}
        </p>
        <button className="restart-btn" onClick={initializeGame}>
          再来一局
        </button>
      </div>

      <style>{`
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 500;
        }
        .overlay-content {
          text-align: center;
          padding: 40px 60px;
          background: rgba(26, 26, 46, 0.95);
          border: 2px solid #00ABB3;
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(0, 171, 179, 0.5);
        }
        .overlay-content h1 {
          font-size: 48px;
          margin-bottom: 16px;
          font-family: 'Roboto Mono', monospace;
        }
        .victory {
          color: #FFD700;
        }
        .game-over {
          color: #FF4444;
        }
        .overlay-text {
          font-size: 18px;
          color: #CCC;
          margin-bottom: 30px;
          font-family: 'Roboto Mono', monospace;
        }
        .restart-btn {
          padding: 14px 40px;
          background: #00ABB3;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'Roboto Mono', monospace;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s ease-in-out;
        }
        .restart-btn:hover {
          background: #008A92;
        }
      `}</style>
    </div>
  );
};

interface GameCanvasProps {
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ cellSize: 0, offsetX: 0, offsetY: 0 });

  const {
    grid,
    towers,
    enemies,
    projectiles,
    particles,
    selectedCell,
    selectedTower,
    selectCell,
    initializeGame,
    update,
  } = useGameStore();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (grid.length === 0) return;

    const maxMapWidth = width * 0.7;
    const minMapWidth = width * 0.6;
    let cellSize = Math.floor(maxMapWidth / GRID_SIZE);
    let mapWidth = cellSize * GRID_SIZE;
    
    if (mapWidth < minMapWidth) {
      cellSize = Math.floor(minMapWidth / GRID_SIZE);
      mapWidth = cellSize * GRID_SIZE;
    }
    
    const mapHeight = cellSize * GRID_SIZE;
    const offsetX = (width - mapWidth) / 2;
    const offsetY = (height - mapHeight) / 2;

    setDimensions({ cellSize, offsetX, offsetY });
  }, [width, height, grid.length]);

  const generateNoise = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 30;
      imageData.data[i] = 45 + noise;
      imageData.data[i + 1] = 45 + noise;
      imageData.data[i + 2] = 68 + noise;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, x, y);
  }, []);

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, cell: Cell, cellSize: number, offsetX: number, offsetY: number) => {
    const x = offsetX + cell.x * cellSize;
    const y = offsetY + cell.y * cellSize;

    if (cell.type === 'obstacle') {
      generateNoise(ctx, x, y, cellSize);
    } else {
      ctx.fillStyle = CELL_COLORS[cell.type];
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellSize, cellSize);
  }, [generateNoise]);

  const drawTower = useCallback((ctx: CanvasRenderingContext2D, tower: Tower, cellSize: number, offsetX: number, offsetY: number, currentTime: number) => {
    const x = offsetX + tower.x * cellSize + cellSize / 2;
    const y = offsetY + tower.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.4;

    if (selectedTower === tower.id) {
      ctx.beginPath();
      ctx.arc(x, y, tower.range * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = `${TOWER_COLORS[tower.type]}20`;
      ctx.fill();
      ctx.strokeStyle = `${TOWER_COLORS[tower.type]}60`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = TOWER_COLORS[tower.type];
    ctx.fill();
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1A1A2E';
    ctx.font = `bold ${cellSize * 0.35}px 'Roboto Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TOWER_LABELS[tower.type], x, y);

    ctx.fillStyle = '#FFF';
    ctx.font = `${cellSize * 0.2}px 'Roboto Mono', monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(`Lv${tower.level}`, x, y + radius + 2);

    if (tower.upgrading) {
      const elapsed = currentTime - tower.upgradeStartTime;
      const progress = Math.min(elapsed / 300, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      ctx.beginPath();
      const gradient = ctx.createRadialGradient(x, y + radius * easeProgress, 0, x, y + radius * easeProgress, radius * 2);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.arc(x, y + radius * easeProgress, radius * 2 * (1 - easeProgress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }, [selectedTower]);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy, cellSize: number, offsetX: number, offsetY: number) => {
    const x = offsetX + enemy.x * cellSize;
    const y = offsetY + enemy.y * cellSize;
    const radius = cellSize * 0.35;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = enemy.slowEffect ? '#87CEEB' : enemy.poisonEffect ? '#32CD32' : '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 2;
    ctx.stroke();

    const hpBarWidth = cellSize * 0.8;
    const hpBarHeight = 4;
    const hpBarX = x - hpBarWidth / 2;
    const hpBarY = y - radius - 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    const hpPercent = enemy.hp / enemy.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  }, []);

  const drawProjectile = useCallback((ctx: CanvasRenderingContext2D, proj: Projectile, cellSize: number, offsetX: number, offsetY: number) => {
    const x = offsetX + proj.x * cellSize;
    const y = offsetY + proj.y * cellSize;

    if (proj.type === 'cannon') {
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, cellSize * 0.2);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, cellSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'ice') {
      ctx.beginPath();
      ctx.fillStyle = '#87CEEB';
      const size = cellSize * 0.18;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (proj.type === 'poison') {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(50, 205, 50, 0.8)';
      ctx.arc(x, y, cellSize * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle, cellSize: number, offsetX: number, offsetY: number) => {
    const x = offsetX + particle.x * cellSize;
    const y = offsetY + particle.y * cellSize;
    const alpha = particle.life / particle.maxLife;

    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.arc(x, y, particle.size * (cellSize / 50), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    if (!canvasRef.current || grid.length === 0 || dimensions.cellSize === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16;
      lastTimeRef.current = currentTime;

      update(Math.min(deltaTime, 33));

      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          drawCell(ctx, grid[y][x], dimensions.cellSize, dimensions.offsetX, dimensions.offsetY);
        }
      }

      towers.forEach(tower => drawTower(ctx, tower, dimensions.cellSize, dimensions.offsetX, dimensions.offsetY, currentTime));
      enemies.forEach(enemy => drawEnemy(ctx, enemy, dimensions.cellSize, dimensions.offsetX, dimensions.offsetY));
      projectiles.forEach(proj => drawProjectile(ctx, proj, dimensions.cellSize, dimensions.offsetX, dimensions.offsetY));
      particles.forEach(particle => drawParticle(ctx, particle, dimensions.cellSize, dimensions.offsetX, dimensions.offsetY));

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [grid, towers, enemies, projectiles, particles, dimensions, drawCell, drawTower, drawEnemy, drawProjectile, drawParticle, update, width, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dimensions.offsetX;
    const y = e.clientY - rect.top - dimensions.offsetY;

    const cellX = Math.floor(x / dimensions.cellSize);
    const cellY = Math.floor(y / dimensions.cellSize);

    if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
      selectCell(cellX, cellY);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{ display: 'block' }}
      />
      {selectedCell && dimensions.cellSize > 0 && (
        <BuildMenu
          x={selectedCell.x}
          y={selectedCell.y}
          cellSize={dimensions.cellSize}
          offsetX={dimensions.offsetX}
          offsetY={dimensions.offsetY}
        />
      )}
    </>
  );
};

export const GameContainer: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const width = Math.max(clientWidth, 800);
        const height = Math.max(clientHeight, 600);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="game-container">
      <GameCanvas width={dimensions.width} height={dimensions.height} />
      <HUD />
      <UpgradePanel />
      <GameOverOverlay />

      <style>{`
        .game-container {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
          position: relative;
          overflow: hidden;
          min-width: 800px;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
