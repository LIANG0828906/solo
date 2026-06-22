import React, { useRef, useEffect, useCallback } from 'react';
import { Snapshot, Organism, SpeciesType } from '../types';

const GRID_SIZE = 200;
const BG_COLOR = '#1B4332';

const SPECIES_COLORS: Record<SpeciesType, string> = {
  [SpeciesType.PLANT]: '#2D6A4F',
  [SpeciesType.HERBIVORE]: '#48CAE4',
  [SpeciesType.CARNIVORE]: '#E63946',
};

interface GridWorldProps {
  snapshot: Snapshot | null;
}

export const GridWorld: React.FC<GridWorldProps> = ({ snapshot }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSnapshotRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    currentSnapshotRef.current = snapshot;
  }, [snapshot]);

  const drawOrganism = useCallback((
    ctx: CanvasRenderingContext2D,
    organism: Organism,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ) => {
    const centerX = offsetX + organism.x * cellSize + cellSize / 2;
    const centerY = offsetY + organism.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.4;

    let alpha = 1;
    if (organism.dying && organism.dyingStart) {
      const elapsed = Date.now() - organism.dyingStart;
      alpha = Math.max(0, 1 - elapsed / 500);
    }
    if (organism.flashing && organism.flashStart) {
      const elapsed = Date.now() - organism.flashStart;
      alpha = elapsed % 100 < 50 ? 1 : 0.2;
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = SPECIES_COLORS[organism.species];

    if (organism.species === SpeciesType.PLANT) {
      ctx.fillRect(
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );
    } else if (organism.species === SpeciesType.HERBIVORE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (organism.species === SpeciesType.CARNIVORE) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX - radius, centerY + radius);
      ctx.lineTo(centerX + radius, centerY + radius);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    const cellWidth = containerWidth / GRID_SIZE;
    const cellHeight = containerHeight / GRID_SIZE;
    const cellSize = Math.min(cellWidth, cellHeight);

    const totalWidth = cellSize * GRID_SIZE;
    const totalHeight = cellSize * GRID_SIZE;
    const offsetX = (containerWidth - totalWidth) / 2;
    const offsetY = (containerHeight - totalHeight) / 2;

    const snap = currentSnapshotRef.current;
    if (snap) {
      for (const organism of snap.organisms) {
        drawOrganism(ctx, organism, cellSize, offsetX, offsetY);
      }
    }
  }, [drawOrganism]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      render();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#76B900',
          opacity: 0.7,
          pointerEvents: 'none',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        EcoSim
      </div>
    </div>
  );
};

export default GridWorld;
