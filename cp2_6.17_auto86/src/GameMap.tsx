import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGameStore } from './store';
import {
  TOWER_CONFIGS,
  TowerType,
  GRID_SIZE,
  COLS,
  ROWS,
  MAP_WIDTH,
  MAP_HEIGHT,
  PATH_POINTS,
  PATH_GRIDS,
  MAX_TOWER_LEVEL,
} from './gameConfig';

const pathGridSet = new Set(PATH_GRIDS.map((g) => `${g.gridX},${g.gridY}`));

const isOnPath = (gridX: number, gridY: number): boolean => {
  return pathGridSet.has(`${gridX},${gridY}`);
};

interface TowerSelectionPanelProps {
  x: number;
  y: number;
  onSelect: (type: TowerType) => void;
  onClose: () => void;
}

const TowerSelectionPanel: React.FC<TowerSelectionPanelProps> = ({
  x,
  y,
  onSelect,
  onClose,
}) => {
  const gold = useGameStore((s) => s.gold);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const towers: TowerType[] = ['archer', 'cannon', 'mage'];

  let panelX = x;
  let panelY = y;
  if (panelX + 180 > MAP_WIDTH) panelX = MAP_WIDTH - 190;
  if (panelY + 220 > MAP_HEIGHT) panelY = MAP_HEIGHT - 230;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        left: panelX,
        top: panelY,
        width: 180,
        borderRadius: 8,
        background: '#16213E',
        padding: 12,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        选择防御塔
      </div>
      {towers.map((type) => {
        const config = TOWER_CONFIGS[type];
        const canAfford = gold >= config.cost;
        const gradients: Record<TowerType, string> = {
          archer: 'linear-gradient(135deg, #00BFFF, #0099CC)',
          cannon: 'linear-gradient(135deg, #FF4500, #CC3700)',
          mage: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
        };

        return (
          <div key={type} style={{ marginBottom: 8 }}>
            <button
              onClick={() => canAfford && onSelect(type)}
              disabled={!canAfford}
              style={{
                width: '100%',
                padding: '10px 8px',
                borderRadius: 6,
                border: 'none',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                background: canAfford ? gradients[type] : '#4A4A4A',
                opacity: canAfford ? 1 : 0.5,
                color: 'white',
                fontSize: 13,
                fontWeight: 'bold',
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (canAfford)
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                if (canAfford)
                  (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                if (canAfford)
                  (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
              }}
            >
              <span>{config.name}</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>
                💰 {config.cost} | 伤害:{config.damage} | 射程:{config.range}
              </span>
            </button>
            {!canAfford && (
              <div
                style={{
                  color: '#FF5252',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                金币不足
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface TowerUpgradePanelProps {
  towerId: string;
  x: number;
  y: number;
  onClose: () => void;
}

const TowerUpgradePanel: React.FC<TowerUpgradePanelProps> = ({
  towerId,
  x,
  y,
  onClose,
}) => {
  const tower = useGameStore((s) => s.towers.find((t) => t.id === towerId));
  const gold = useGameStore((s) => s.gold);
  const upgradeTower = useGameStore((s) => s.upgradeTower);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!tower) return null;

  const config = TOWER_CONFIGS[tower.type];
  const canUpgrade = tower.level < MAX_TOWER_LEVEL && gold >= config.upgradeCost;
  const isMaxLevel = tower.level >= MAX_TOWER_LEVEL;

  let panelX = x;
  let panelY = y;
  if (panelX + 160 > MAP_WIDTH) panelX = MAP_WIDTH - 170;
  if (panelY + 140 > MAP_HEIGHT) panelY = MAP_HEIGHT - 150;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        left: panelX,
        top: panelY,
        width: 160,
        borderRadius: 8,
        background: '#2C3E50',
        padding: 12,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {config.name} Lv.{tower.level}
      </div>
      <div style={{ color: '#ccc', fontSize: 11, marginBottom: 8, textAlign: 'center' }}>
        伤害: {tower.damage} | 射程: {tower.range}
      </div>
      <button
        onClick={() => canUpgrade && upgradeTower(towerId)}
        disabled={!canUpgrade}
        style={{
          width: '100%',
          padding: '10px 8px',
          borderRadius: 6,
          border: 'none',
          cursor: canUpgrade ? 'pointer' : 'not-allowed',
          background: canUpgrade
            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
            : 'rgba(100,100,100,0.5)',
          opacity: canUpgrade ? 1 : 0.5,
          color: isMaxLevel ? '#aaa' : '#1a1a1a',
          fontSize: 13,
          fontWeight: 'bold',
          transition: 'transform 0.15s ease-out',
        }}
        onMouseEnter={(e) => {
          if (canUpgrade)
            (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (canUpgrade)
            (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          if (canUpgrade)
            (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
      >
        {isMaxLevel ? '已满级' : `升级 花费${config.upgradeCost}`}
      </button>
      {!canUpgrade && !isMaxLevel && (
        <div
          style={{
            color: '#FF5252',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          金币不足
        </div>
      )}
    </div>
  );
};

const EntryMarker: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: -2,
      top: 7 * GRID_SIZE,
      width: GRID_SIZE,
      height: GRID_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 30 30">
      <polygon
        points="5,15 20,5 20,12 28,12 28,18 20,18 20,25"
        fill="#00E676"
        stroke="#00C853"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

const ExitMarker: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: MAP_WIDTH - GRID_SIZE + 2,
      top: 7 * GRID_SIZE,
      width: GRID_SIZE,
      height: GRID_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 30 30">
      <rect x="6" y="3" width="2" height="24" fill="#8B4513" />
      <polygon
        points="8,3 26,7 8,13"
        fill="#FF5252"
        stroke="#D32F2F"
        strokeWidth="1"
      />
      <circle cx="6" cy="27" r="3" fill="#8B4513" />
    </svg>
  </div>
);

export const GameMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const {
    towers,
    enemies,
    projectiles,
    effects,
    hitParticles,
    selectedGridCell,
    selectedTower,
    selectGridCell,
    selectTower,
    clearSelection,
    buildTower,
  } = useGameStore();

  const pathGridLookup = useMemo(() => {
    const map = new Map<string, { gridX: number; gridY: number }>();
    for (const g of PATH_GRIDS) {
      map.set(`${g.gridX},${g.gridY}`, g);
    }
    return map;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      ctx.fillStyle = '#1B2A3A';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * GRID_SIZE, 0);
        ctx.lineTo(x * GRID_SIZE, MAP_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * GRID_SIZE);
        ctx.lineTo(MAP_WIDTH, y * GRID_SIZE);
        ctx.stroke();
      }

      for (const grid of PATH_GRIDS) {
        const px = grid.gridX * GRID_SIZE;
        const py = grid.gridY * GRID_SIZE;

        ctx.fillStyle = '#3D5A80';
        ctx.fillRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);

        ctx.strokeStyle = 'rgba(100, 140, 180, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4);
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = 'rgba(120, 160, 200, 0.25)';
      ctx.lineWidth = GRID_SIZE - 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
      for (let i = 1; i < PATH_POINTS.length; i++) {
        ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
      ctx.stroke();

      if (hoveredCell) {
        const gx = hoveredCell.x;
        const gy = hoveredCell.y;
        const hasTower = towers.some((t) => t.gridX === gx && t.gridY === gy);
        const onPath = pathGridLookup.has(`${gx},${gy}`);
        if (!hasTower && !onPath && gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
          ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
          ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.strokeRect(gx * GRID_SIZE + 1, gy * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        } else if (hasTower) {
          ctx.fillStyle = 'rgba(233, 69, 96, 0.2)';
          ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
      }

      const breathScale = 0.95 + 0.05 * Math.sin(time / 400);

      for (const tower of towers) {
        ctx.save();
        ctx.translate(tower.x, tower.y);
        ctx.scale(breathScale, breathScale);

        for (let i = 0; i < tower.level - 1; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, 18 + i * 5, 0, Math.PI * 2);
          ctx.strokeStyle = tower.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4 - i * 0.1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (tower.type === 'archer') {
          ctx.save();
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const px = Math.cos(angle) * 15;
            const py = Math.sin(angle) * 15;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = tower.color;
          ctx.fill();
          ctx.strokeStyle = '#0099CC';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (tower.type === 'cannon') {
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = tower.color;
          ctx.fill();
          ctx.strokeStyle = '#CC3700';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#6B2200';
          ctx.fill();
        } else if (tower.type === 'mage') {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const r = i % 2 === 0 ? 15 : 7;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = tower.color;
          ctx.fill();
          ctx.strokeStyle = '#8E44AD';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const enemy of enemies) {
        const currentState = useGameStore.getState();
        const e = currentState.enemies.find((en) => en.id === enemy.id);
        if (!e) continue;

        if (e.type === 'boss') {
          const shieldAlpha = 0.3 + 0.3 * Math.sin(time / 100);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(142, 68, 173, ${shieldAlpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (e.slowTimer > 0) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(155, 89, 182, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      for (const proj of projectiles) {
        if (proj.type === 'archer') {
          const currentState = useGameStore.getState();
          const target = currentState.enemies.find((e) => e.id === proj.targetId);
          const tx = target ? target.x : proj.targetX;
          const ty = target ? target.y : proj.targetY;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          const dx = tx - proj.x;
          const dy = ty - proj.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          ctx.lineTo(proj.x + (dx / len) * 10, proj.y + (dy / len) * 10);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (proj.type === 'cannon') {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#333';
          ctx.fill();
          ctx.strokeStyle = '#FF4500';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (proj.type === 'mage') {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 5);
          gradient.addColorStop(0, '#E8DAEF');
          gradient.addColorStop(1, '#9B59B6');
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      for (const effect of effects) {
        if (effect.type === 'explosion') {
          const radius = effect.radius * (1 + effect.progress);
          const alpha = 1 - effect.progress;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            effect.x,
            effect.y,
            0,
            effect.x,
            effect.y,
            radius
          );
          gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.7})`);
          gradient.addColorStop(1, `rgba(255, 69, 0, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      for (const particle of hitParticles) {
        const alpha = 1 - particle.progress;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [towers, enemies, projectiles, effects, hitParticles, hoveredCell, pathGridLookup]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);

    const clickedTower = towers.find(
      (t) =>
        Math.abs(t.x - x) < 20 && Math.abs(t.y - y) < 20
    );

    if (clickedTower) {
      selectTower(clickedTower.id);
      return;
    }

    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) {
      clearSelection();
      return;
    }

    if (pathGridLookup.has(`${gridX},${gridY}`)) {
      clearSelection();
      return;
    }

    const hasTower = towers.some((t) => t.gridX === gridX && t.gridY === gridY);
    if (!hasTower) {
      selectGridCell(gridX, gridY);
    } else {
      clearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);

    if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
      if (!hoveredCell || hoveredCell.x !== gridX || hoveredCell.y !== gridY) {
        setHoveredCell({ x: gridX, y: gridY });
      }
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleBuildTower = (type: TowerType) => {
    if (selectedGridCell) {
      buildTower(type, selectedGridCell.gridX, selectedGridCell.gridY);
    }
  };

  const selectedTowerObj = selectedTower
    ? towers.find((t) => t.id === selectedTower)
    : null;

  return (
    <div
      style={{
        position: 'relative',
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        border: '2px solid #4A4A6E',
        borderRadius: 4,
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'block',
          cursor: 'crosshair',
        }}
      />

      <EntryMarker />
      <ExitMarker />

      {enemies.map((enemy) => (
        <div
          key={enemy.id}
          style={{
            position: 'absolute',
            left: enemy.x - 15,
            top: enemy.y - enemy.radius - 10,
            width: 30,
            height: 4,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#E74C3C',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                height: '100%',
                background: '#00E676',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>
      ))}

      {selectedGridCell && (
        <TowerSelectionPanel
          x={selectedGridCell.gridX * GRID_SIZE + GRID_SIZE}
          y={selectedGridCell.gridY * GRID_SIZE}
          onSelect={handleBuildTower}
          onClose={clearSelection}
        />
      )}

      {selectedTowerObj && (
        <TowerUpgradePanel
          towerId={selectedTowerObj.id}
          x={selectedTowerObj.x + 25}
          y={selectedTowerObj.y - 30}
          onClose={clearSelection}
        />
      )}
    </div>
  );
};

void isOnPath;
