import { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/store';
import { TOWER_DEFS, getTowerStats } from '../engine/gameEngine';
import type { Particle } from '../types';

export function GameBoard() {
  const cells = useGameStore((state) => state.cells);
  const towers = useGameStore((state) => state.towers);
  const monsters = useGameStore((state) => state.monsters);
  const selectedTowerType = useGameStore((state) => state.selectedTowerType);
  const placeTower = useGameStore((state) => state.placeTower);
  const showUpgradePanel = useGameStore((state) => state.showUpgradePanel);
  const cellSize = useGameStore((state) => state.cellSize);
  const gridCols = useGameStore((state) => state.gridCols);
  const gridRows = useGameStore((state) => state.gridRows);
  const fps = useGameStore((state) => state.fps);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  const boardWidth = gridCols * cellSize;
  const boardHeight = gridRows * cellSize;

  const towerMap = useMemo(() => {
    const map = new Map<string, (typeof towers)[0]>();
    for (const t of towers) {
      map.set(`${t.x},${t.y}`, t);
    }
    return map;
  }, [towers]);

  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * boardWidth,
        y: Math.random() * boardHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        active: true,
      });
    }
    particlesRef.current = particles;
  }, [boardWidth, boardHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, boardWidth, boardHeight);

      drawCells(ctx);
      drawTowers(ctx);
      drawMonsters(ctx);
      drawParticles(ctx);

      animationId = requestAnimationFrame(render);
    };

    const drawCells = (ctx: CanvasRenderingContext2D) => {
      for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
          const cell = cells[y]?.[x];
          if (!cell) continue;

          const px = x * cellSize;
          const py = y * cellSize;

          if (cell.type === 'path') {
            ctx.fillStyle = '#4A4A3A';
          } else {
            ctx.fillStyle = '#2D2D1E';
          }

          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = '#3A3A2A';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        }
      }
    };

    const drawTowers = (ctx: CanvasRenderingContext2D) => {
      for (const tower of towers) {
        const def = TOWER_DEFS[tower.type];
        const px = tower.x * cellSize;
        const py = tower.y * cellSize;
        const size = cellSize - 8;
        const offset = 4;

        ctx.fillStyle = def.color;
        ctx.fillRect(px + offset, py + offset, size, size);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + offset, py + offset, size, 4);
        ctx.fillRect(px + offset, py + offset, 4, size);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + offset, py + size + offset - 4, size, 4);
        ctx.fillRect(px + size + offset - 4, py + offset, 4, size);

        if (tower.level > 1) {
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < tower.level; i++) {
            ctx.fillRect(px + 6 + i * 6, py + cellSize - 8, 4, 4);
          }
        }
      }
    };

    const drawMonsters = (ctx: CanvasRenderingContext2D) => {
      for (const monster of monsters) {
        const px = monster.x * cellSize + cellSize / 2;
        const py = monster.y * cellSize + cellSize / 2;
        const size = monster.size;
        const half = size / 2;

        ctx.fillStyle = monster.color;
        ctx.fillRect(px - half, py - half, size, size);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - half + 3, py - half + 4, 3, 3);
        ctx.fillRect(px + half - 6, py - half + 4, 3, 3);

        ctx.fillStyle = '#000000';
        ctx.fillRect(px - half + 4, py - half + 5, 1, 1);
        ctx.fillRect(px + half - 5, py - half + 5, 1, 1);

        const hpRatio = Math.max(0, monster.hp / monster.maxHp);
        const barWidth = size;
        const barHeight = 3;
        const barX = px - half;
        const barY = py - half - 6;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        if (monster.burnEffect) {
          ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
          ctx.fillRect(px - half - 2, py - half - 2, size + 4, size + 4);
        }
      }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      const particles = particlesRef.current;
      const skipParticles = fps < 30;
      const updateEvery = fps < 25 ? 2 : fps < 30 ? 1 : 1;
      let frameCounter = 0;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

      for (const p of particles) {
        if (!p.active) continue;

        if (
          p.x < -20 ||
          p.x > boardWidth + 20 ||
          p.y < -20 ||
          p.y > boardHeight + 20
        ) {
          continue;
        }

        ctx.fillRect(p.x, p.y, 1, 1);

        if (!skipParticles || frameCounter % updateEvery === 0) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > boardWidth) p.vx *= -1;
          if (p.y < 0 || p.y > boardHeight) p.vy *= -1;
        }

        frameCounter++;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [cells, towers, monsters, cellSize, gridCols, gridRows, boardWidth, boardHeight, fps]);

  const handleCellClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (x < 0 || x >= gridCols || y < 0 || y >= gridRows) return;

    const cell = cells[y]?.[x];
    if (!cell) return;

    const existingTower = towerMap.get(`${x},${y}`);
    if (existingTower) {
      showUpgradePanel(existingTower.id, e.clientX, e.clientY);
      return;
    }

    if (cell.type === 'path') return;

    if (selectedTowerType) {
      placeTower(x, y);
    }
  };

  const renderRangeIndicator = () => {
    if (!selectedTowerType) return null;
    const def = TOWER_DEFS[selectedTowerType];
    const stats = getTowerStats(selectedTowerType, 1);
    return (
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#C0C0C0',
          fontFamily: 'monospace',
          fontSize: 12,
          padding: '4px 8px',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      >
        {def.name} | 伤害:{stats.damage.toFixed(0)} | 射程:{stats.range.toFixed(1)}
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1A10',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {renderRangeIndicator()}
      <div
        ref={containerRef}
        onClick={handleCellClick}
        style={{
          position: 'relative',
          width: boardWidth,
          height: boardHeight,
          cursor: selectedTowerType ? 'crosshair' : 'default',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={boardWidth}
          height={boardHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
