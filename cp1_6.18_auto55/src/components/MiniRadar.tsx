import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTerrainColor, MAP_WIDTH, MAP_HEIGHT, CELL_SIZE } from '../modules/terrainGenerator';
import { UnitType } from '../types';

export default function MiniRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanOffsetRef = useRef(0);
  const animationRef = useRef(0);

  const units = useGameStore((s) => s.units);
  const enemies = useGameStore((s) => s.enemies);
  const fogState = useGameStore((s) => s.fogState);
  const mapData = useGameStore((s) => s.mapData);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const scaleX = w / (MAP_WIDTH * CELL_SIZE);
      const scaleY = h / (MAP_HEIGHT * CELL_SIZE);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, w, h);

      if (mapData) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
          for (let x = 0; x < MAP_WIDTH; x++) {
            const key = `${x},${y}`;
            if (fogState.visibleCells.has(key)) {
              const cell = mapData.grid[y][x];
              ctx.fillStyle = getTerrainColor(cell.type);
              ctx.fillRect(
                x * CELL_SIZE * scaleX,
                y * CELL_SIZE * scaleY,
                CELL_SIZE * scaleX + 1,
                CELL_SIZE * scaleY + 1
              );
            }
          }
        }

        if (mapData.extractionPoint) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(
            mapData.extractionPoint.x * scaleX,
            mapData.extractionPoint.y * scaleY,
            4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      units.forEach((unit) => {
        const color = unit.type === UnitType.COMMANDER ? '#00E5FF' : '#6BCB77';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          unit.position.x * scaleX,
          unit.position.y * scaleY,
          unit.id === selectedUnitId ? 4 : 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (unit.id === selectedUnitId) {
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(
            unit.position.x * scaleX,
            unit.position.y * scaleY,
            6,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      });

      enemies.forEach((enemy) => {
        const key = `${Math.floor(enemy.position.x / CELL_SIZE)},${Math.floor(enemy.position.y / CELL_SIZE)}`;
        if (fogState.visibleCells.has(key)) {
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(
            enemy.position.x * scaleX,
            enemy.position.y * scaleY,
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      scanOffsetRef.current = (scanOffsetRef.current + 0.01) % 1;
      const gradient = ctx.createLinearGradient(
        scanOffsetRef.current * w,
        0,
        (scanOffsetRef.current + 0.1) * w,
        0
      );
      gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(42, 42, 68, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [units, enemies, fogState.visibleCells, mapData, selectedUnitId]);

  return (
    <canvas
      ref={canvasRef}
      width={150}
      height={150}
      className="rounded-lg"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      }}
    />
  );
}
