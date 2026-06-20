import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Bee, Flower, Enemy, Position, BeeType } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onCanvasClick: (position: Position) => void;
  onMouseMove: (position: Position) => void;
  onMouseWheel: (delta: number, position: Position) => void;
  selectedBeeType: BeeType | null;
}

const GRID_SIZE = 40;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onCanvasClick,
  onMouseMove,
  onMouseWheel,
  selectedBeeType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { hive, bees, flowers, enemies, particles, mapSize, discoveredAreas, mousePosition, selectedBeeType: _unused } = gameState;

  const screenToWorld = useCallback((screenX: number, screenY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { width, height } = canvas;
      
      ctx.clearRect(0, 0, width, height);
      
      drawBackground(ctx, width, height);
      drawGrid(ctx, width, height);
      drawFogOfWar(ctx, width, height, discoveredAreas);
      drawFlowers(ctx, flowers, discoveredAreas);
      drawHive(ctx, hive);
      drawBeePaths(ctx, bees);
      drawBees(ctx, bees);
      drawEnemies(ctx, enemies);
      drawParticles(ctx, particles);
      
      if (selectedBeeType) {
        drawPlacementPreview(ctx, mousePosition, selectedBeeType);
      }
    };

    render();
  }, [gameState, selectedBeeType, mousePosition, discoveredAreas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const scale = Math.min(containerWidth / mapSize.width, containerHeight / mapSize.height);
      
      canvas.width = mapSize.width;
      canvas.height = mapSize.height;
      canvas.style.width = `${mapSize.width * scale}px`;
      canvas.style.height = `${mapSize.height * scale}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [mapSize]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = screenToWorld(e.clientX, e.clientY);
    onCanvasClick(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = screenToWorld(e.clientX, e.clientY);
    onMouseMove(pos);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = screenToWorld(e.clientX, e.clientY);
    onMouseWheel(e.deltaY, pos);
  };

  return (
    <div ref={containerRef} className="game-canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        style={{ cursor: selectedBeeType ? 'crosshair' : 'default' }}
      />
    </div>
  );
};

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#7CFC00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawFogOfWar(ctx: CanvasRenderingContext2D, width: number, height: number, discoveredAreas: Set<string>) {
  ctx.save();
  
  ctx.fillStyle = 'rgba(30, 30, 50, 0.7)';
  ctx.fillRect(0, 0, width, height);
  
  ctx.globalCompositeOperation = 'destination-out';
  
  discoveredAreas.forEach((key) => {
    const [gx, gy] = key.split(',').map(Number);
    const x = gx * GRID_SIZE + GRID_SIZE / 2;
    const y = gy * GRID_SIZE + GRID_SIZE / 2;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, GRID_SIZE * 1.5);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.arc(x, y, GRID_SIZE * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function drawFlowers(ctx: CanvasRenderingContext2D, flowers: Flower[], discoveredAreas: Set<string>) {
  flowers.forEach((flower) => {
    const gridKey = `${Math.floor(flower.position.x / GRID_SIZE)},${Math.floor(flower.position.y / GRID_SIZE)}`;
    const isDiscovered = flower.discovered || discoveredAreas.has(gridKey);
    
    if (!isDiscovered) return;
    
    const { x, y } = flower.position;
    const petalCount = 6;
    const petalRadius = 12;
    const centerRadius = 6;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flower.rotation);
    
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px = Math.cos(angle) * petalRadius * 0.6;
      const py = Math.sin(angle) * petalRadius * 0.6;
      
      ctx.fillStyle = flower.color;
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.ellipse(px, py, petalRadius * 0.7, petalRadius * 0.4, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (flower.honeyAmount < flower.maxHoney * 0.3) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, petalRadius + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  });
}

function drawHive(ctx: CanvasRenderingContext2D, hive: any) {
  const { x, y } = hive.position;
  const baseSize = 30 + hive.level * 5;
  const glowIntensity = 0.3 + Math.sin(hive.glowPhase) * 0.1;
  const upgradeScale = hive.upgradeAnimation > 0 ? 1 + (hive.upgradeAnimation / 0.8) * 0.3 : 1;
  const size = baseSize * upgradeScale;
  
  const glowColor = hive.level >= 4 ? '#FFD700' : hive.level >= 2 ? '#FFE066' : '#FFFACD';
  
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, hive.glowRadius);
  gradient.addColorStop(0, `${glowColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, hive.glowRadius, 0, Math.PI * 2);
  ctx.fill();
  
  if (hive.upgradeAnimation > 0) {
    const progress = 1 - hive.upgradeAnimation / 0.8;
    const hexRadius = size * (1 + progress * 0.5);
    const alpha = 1 - progress;
    
    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.lineWidth = 3;
    drawHexagon(ctx, x, y, hexRadius);
    ctx.stroke();
  }
  
  ctx.save();
  ctx.translate(x, y);
  
  ctx.fillStyle = '#F5DEB3';
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  
  drawHexagon(ctx, 0, 0, size);
  ctx.fill();
  ctx.stroke();
  
  ctx.strokeStyle = '#D4A76A';
  ctx.lineWidth = 1;
  
  for (let ring = 1; ring <= 2 + hive.level; ring++) {
    const ringSize = (size * ring) / (3 + hive.level);
    drawHexagon(ctx, 0, 0, ringSize);
    ctx.stroke();
  }
  
  const innerHexSize = size * 0.3;
  ctx.fillStyle = '#8B4513';
  drawHexagon(ctx, 0, 0, innerHexSize);
  ctx.fill();
  ctx.strokeStyle = '#4A3728';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
  
  const shieldPercent = hive.shield / hive.maxShield;
  const shieldWidth = size * 2;
  const shieldHeight = 6;
  const shieldX = x - shieldWidth / 2;
  const shieldY = y - size - 15;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(shieldX, shieldY, shieldWidth, shieldHeight);
  
  const shieldColor = shieldPercent > 0.5 ? '#4CAF50' : shieldPercent > 0.25 ? '#FFC107' : '#F44336';
  ctx.fillStyle = shieldColor;
  ctx.fillRect(shieldX, shieldY, shieldWidth * shieldPercent, shieldHeight);
  
  ctx.strokeStyle = '#4A3728';
  ctx.lineWidth = 1;
  ctx.strokeRect(shieldX, shieldY, shieldWidth, shieldHeight);
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawBeePaths(ctx: CanvasRenderingContext2D, bees: Bee[]) {
  bees.forEach((bee) => {
    if (bee.path.length === 0 || bee.pathIndex >= bee.path.length) return;
    
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    ctx.beginPath();
    ctx.moveTo(bee.position.x, bee.position.y);
    
    for (let i = bee.pathIndex; i < bee.path.length; i++) {
      ctx.lineTo(bee.path[i].x, bee.path[i].y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function drawBees(ctx: CanvasRenderingContext2D, bees: Bee[]) {
  bees.forEach((bee) => {
    const { x, y } = bee.position;
    
    ctx.save();
    ctx.translate(x, y);
    
    let bodyColor: string;
    let wingColor: string;
    let size: number;
    
    switch (bee.type) {
      case 'collector':
        bodyColor = '#FFD700';
        wingColor = 'rgba(255, 255, 255, 0.6)';
        size = 10;
        break;
      case 'scout':
        bodyColor = '#C0C0C0';
        wingColor = 'rgba(200, 200, 200, 0.6)';
        size = 8;
        break;
      case 'guardian':
        bodyColor = '#DC143C';
        wingColor = 'rgba(255, 200, 200, 0.6)';
        size = 12;
        break;
      default:
        bodyColor = '#FFD700';
        wingColor = 'rgba(255, 255, 255, 0.6)';
        size = 10;
    }
    
    const wingFlap = Math.sin(Date.now() / 30) * 0.3;
    
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    
    ctx.save();
    ctx.rotate(-0.3 + wingFlap);
    ctx.beginPath();
    ctx.ellipse(-size * 0.3, -size * 0.8, size * 0.8, size * 0.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.rotate(0.3 - wingFlap);
    ctx.beginPath();
    ctx.ellipse(size * 0.3, -size * 0.8, size * 0.8, size * 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.6, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, i * size * 0.35);
      ctx.lineTo(size * 0.5, i * size * 0.35);
      ctx.stroke();
    }
    
    if (bee.type === 'guardian') {
      ctx.fillStyle = '#8B0000';
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < 4; i++) {
        const sx = (i - 1.5) * size * 0.3;
        ctx.beginPath();
        ctx.ellipse(sx, -size * 0.2, size * 0.15, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.5, 2, 0, Math.PI * 2);
    ctx.arc(size * 0.25, -size * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    if (bee.type === 'collector' && bee.carryHoney > 0) {
      const carryPercent = bee.carryHoney / bee.maxCarry;
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(0, size * 0.8, size * 0.4 * carryPercent + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    if (bee.state === 'attacking') {
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
      ctx.lineWidth = 2;
      const pulseRadius = size * 2 + Math.sin(Date.now() / 50) * 5;
      ctx.beginPath();
      ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
  enemies.forEach((enemy) => {
    const { x, y } = enemy.position;
    
    ctx.save();
    ctx.translate(x, y);
    
    let bodyColor: string;
    let size: number;
    let speed: number;
    
    switch (enemy.type) {
      case 'wasp':
        bodyColor = '#FFD700';
        size = 11;
        speed = 2;
        break;
      case 'bumblebee':
        bodyColor = '#8B4513';
        size = 16;
        speed = 1;
        break;
      case 'hornet':
        bodyColor = '#FF8C00';
        size = 14;
        speed = 2.5;
        break;
      default:
        bodyColor = '#FFD700';
        size = 11;
        speed = 2;
    }
    
    if (enemy.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const wingFlap = Math.sin(Date.now() / 25) * 0.4;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    
    ctx.save();
    ctx.rotate(-0.4 + wingFlap);
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.9, size * 0.9, size * 0.45, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.rotate(0.4 - wingFlap);
    ctx.beginPath();
    ctx.ellipse(size * 0.2, -size * 0.9, size * 0.9, size * 0.45, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.55, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const stripeCount = enemy.type === 'bumblebee' ? 2 : 3;
    for (let i = 0; i < stripeCount; i++) {
      const yPos = -size * 0.5 + (i * size) / (stripeCount - 1 + 0.5);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, yPos);
      ctx.lineTo(size * 0.5, yPos);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, -size * 0.8, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.85, 2, 0, Math.PI * 2);
    ctx.arc(size * 0.15, -size * 0.85, 2, 0, Math.PI * 2);
    ctx.fill();
    
    if (enemy.type === 'hornet') {
      ctx.fillStyle = '#333';
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 1.1);
      ctx.lineTo(-size * 0.3, -size * 1.5);
      ctx.lineTo(-size * 0.1, -size * 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -size * 1.1);
      ctx.lineTo(size * 0.3, -size * 1.5);
      ctx.lineTo(size * 0.1, -size * 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
    
    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = size * 2;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - size - 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: any[]) {
  particles.forEach((particle) => {
    const alpha = particle.life / particle.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlacementPreview(ctx: CanvasRenderingContext2D, position: Position, beeType: BeeType) {
  const { x, y } = position;
  
  ctx.save();
  ctx.globalAlpha = 0.5;
  
  let color: string;
  switch (beeType) {
    case 'collector':
      color = '#FFD700';
      break;
    case 'scout':
      color = '#C0C0C0';
      break;
    case 'guardian':
      color = '#DC143C';
      break;
    default:
      color = '#FFD700';
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
