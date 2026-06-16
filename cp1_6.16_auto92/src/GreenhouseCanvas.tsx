import React, { useRef, useEffect, useCallback } from 'react';
import {
  PlantData,
  PlantType,
  GrowthStage,
  ClimateParams,
  WeatherType,
  getHealthColor,
} from './PlantManager';

interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

interface GreenhouseCanvasProps {
  plants: PlantData[];
  climate: ClimateParams;
  weather: WeatherType;
  selectedPlantType: PlantType | null;
  onPlacePlant: (gridX: number, gridY: number) => void;
  onSelectPlant: (id: string) => void;
  selectedPlantId: string | null;
}

const GRID_SIZE = 120;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, weather: WeatherType, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  if (weather === 'sunny') {
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B2DFDB');
    gradient.addColorStop(1, '#A5D6A7');
  } else if (weather === 'rainy') {
    gradient.addColorStop(0, '#546E7A');
    gradient.addColorStop(0.5, '#78909C');
    gradient.addColorStop(1, '#607D8B');
  } else {
    gradient.addColorStop(0, '#90A4AE');
    gradient.addColorStop(0.5, '#B0BEC5');
    gradient.addColorStop(1, '#A5D6A7');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  if (weather === 'sunny') {
    const sunX = w * 0.85;
    const sunY = 60;
    const glowRadius = 80 + Math.sin(time * 2) * 10;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, glowRadius);
    sunGlow.addColorStop(0, 'rgba(255,235,59,0.6)');
    sunGlow.addColorStop(0.5, 'rgba(255,193,7,0.2)');
    sunGlow.addColorStop(1, 'rgba(255,193,7,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - glowRadius, sunY - glowRadius, glowRadius * 2, glowRadius * 2);

    ctx.beginPath();
    ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD54F';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEB3B';
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.5;
      const innerR = 30;
      const outerR = 45 + Math.sin(time * 3 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
      ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
      ctx.strokeStyle = 'rgba(255,193,7,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(200,210,200,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stage: GrowthStage,
  health: number,
  flowers: PlantData['flowers'],
  time: number
) {
  const color = getHealthColor(health);
  const darkColor = health >= 70 ? '#1B5E20' : health >= 40 ? '#8D6E2F' : '#6D4C2F';

  ctx.save();
  ctx.translate(x, y);

  if (stage === GrowthStage.Seed) {
    ctx.beginPath();
    ctx.arc(0, -6, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (stage === GrowthStage.Seedling) {
    ctx.beginPath();
    ctx.ellipse(0, -14, 7, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const sy = -8 + i * 5;
      ctx.beginPath();
      ctx.moveTo(-7, sy);
      ctx.lineTo(-10, sy - 2);
      ctx.moveTo(7, sy);
      ctx.lineTo(10, sy - 2);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (stage === GrowthStage.Young) {
    ctx.beginPath();
    ctx.ellipse(0, -20, 9, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-14, -16, 6, 10, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const sy = -10 + i * 5;
      ctx.beginPath();
      ctx.moveTo(-9, sy);
      ctx.lineTo(-13, sy - 2);
      ctx.moveTo(9, sy);
      ctx.lineTo(13, sy - 2);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-10, -40);
    ctx.quadraticCurveTo(-10, -50, 0, -50);
    ctx.quadraticCurveTo(10, -50, 10, -40);
    ctx.lineTo(10, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(-22, -20);
    ctx.quadraticCurveTo(-28, -20, -28, -28);
    ctx.lineTo(-28, -35);
    ctx.quadraticCurveTo(-28, -38, -24, -38);
    ctx.lineTo(-20, -38);
    ctx.quadraticCurveTo(-18, -38, -18, -35);
    ctx.lineTo(-18, -22);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, -28);
    ctx.lineTo(20, -28);
    ctx.quadraticCurveTo(24, -28, 24, -32);
    ctx.lineTo(24, -40);
    ctx.quadraticCurveTo(24, -43, 21, -43);
    ctx.lineTo(18, -43);
    ctx.quadraticCurveTo(16, -43, 16, -40);
    ctx.lineTo(16, -30);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const sy = -5 + i * 4.5;
      if (sy < -50) break;
      ctx.beginPath();
      ctx.moveTo(-10, sy);
      ctx.lineTo(-14, sy - 2);
      ctx.moveTo(10, sy);
      ctx.lineTo(14, sy - 2);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  if (health < 50) {
    const spotCount = Math.floor((50 - health) / 10);
    for (let i = 0; i < spotCount; i++) {
      const sx = (Math.sin(i * 2.7 + time * 0.1) * 0.5) * 8;
      const sy = -10 - i * 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,69,19,0.6)';
      ctx.fill();
    }
  }

  flowers.forEach((f) => drawFlower(ctx, f.offsetX, f.offsetY - (stage === GrowthStage.Mature ? 50 : 0), f.color, f.bloomProgress, time));

  ctx.restore();
}

function drawFern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stage: GrowthStage,
  health: number,
  flowers: PlantData['flowers'],
  time: number
) {
  const color = getHealthColor(health);
  const darkColor = health >= 70 ? '#2E7D32' : health >= 40 ? '#8D6E2F' : '#6D4C2F';

  ctx.save();
  ctx.translate(x, y);

  if (stage === GrowthStage.Seed) {
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (stage === GrowthStage.Seedling) {
    const sway = Math.sin(time * 1.5) * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway, -15, sway * 0.5, -25);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const t2 = 0.3 + i * 0.15;
      const fx = lerp(0, sway * 0.5, t2);
      const fy = lerp(0, -25, t2);
      const side = i % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + side * 8, fy - 3, fx + side * 5, fy - 6);
      ctx.fillStyle = color;
      ctx.fill();
    }
  } else if (stage === GrowthStage.Young) {
    const fronds = 4;
    for (let f = 0; f < fronds; f++) {
      const baseAngle = -Math.PI / 2 + (f - (fronds - 1) / 2) * 0.4;
      const sway = Math.sin(time * 1.2 + f) * 0.05;
      const angle = baseAngle + sway;
      const len = 28 + f * 3;
      ctx.save();
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0, -len * 0.5, 0, -len);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const t2 = 0.2 + i * 0.1;
        const ly = -len * t2;
        const side = i % 2 === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.quadraticCurveTo(side * 7, ly - 2, side * 5, ly - 5);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.restore();
    }
  } else {
    const fronds = 7;
    for (let f = 0; f < fronds; f++) {
      const baseAngle = -Math.PI / 2 + (f - (fronds - 1) / 2) * 0.3;
      const sway = Math.sin(time * 1.2 + f * 0.5) * 0.06;
      const angle = baseAngle + sway;
      const len = 35 + Math.sin(f * 1.5) * 8;
      ctx.save();
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0, -len * 0.5, 0, -len);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const t2 = 0.15 + i * 0.09;
        const ly = -len * t2;
        const side = i % 2 === 0 ? 1 : -1;
        const leafLen = 10 * (1 - t2 * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.quadraticCurveTo(side * leafLen, ly - 2, side * (leafLen - 2), ly - 5);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  if (health < 50) {
    const spotCount = Math.floor((50 - health) / 10);
    for (let i = 0; i < spotCount; i++) {
      const sx = (Math.sin(i * 3.1 + time * 0.1) * 0.5) * 15;
      const sy = -10 - i * 6;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,69,19,0.6)';
      ctx.fill();
    }
  }

  flowers.forEach((f) => drawFlower(ctx, f.offsetX, f.offsetY, f.color, f.bloomProgress, time));

  ctx.restore();
}

function drawOrchid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stage: GrowthStage,
  health: number,
  flowers: PlantData['flowers'],
  time: number
) {
  const color = getHealthColor(health);
  const darkColor = health >= 70 ? '#2E7D32' : health >= 40 ? '#8D6E2F' : '#6D4C2F';

  ctx.save();
  ctx.translate(x, y);

  if (stage === GrowthStage.Seed) {
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (stage === GrowthStage.Seedling) {
    const sway = Math.sin(time * 1.2) * 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway, -12, 0, -20);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sway * 0.5, -10, 8, 4, -0.2 + sway * 0.02, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (stage === GrowthStage.Young) {
    const sway = Math.sin(time * 1.2) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.5, -20, sway * 0.3, -35);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-8 + sway * 0.2, -12, 12, 5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6 + sway * 0.2, -18, 11, 5, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4 + sway * 0.3, -24, 10, 5, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    const sway = Math.sin(time * 1.2) * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.3, -25, sway * 0.2, -50);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    const leaves = [
      { x: -10, y: -12, rx: 14, ry: 5, rot: -0.35 },
      { x: 8, y: -18, rx: 13, ry: 5, rot: 0.25 },
      { x: -6, y: -26, rx: 12, ry: 5, rot: -0.15 },
      { x: 5, y: -34, rx: 11, ry: 4, rot: 0.1 },
    ];
    leaves.forEach((l) => {
      ctx.beginPath();
      ctx.ellipse(l.x + sway * 0.2, l.y, l.rx, l.ry, l.rot, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  if (health < 50) {
    const spotCount = Math.floor((50 - health) / 10);
    for (let i = 0; i < spotCount; i++) {
      const sx = (Math.sin(i * 2.7 + time * 0.1) * 0.5) * 10;
      const sy = -8 - i * 7;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,69,19,0.6)';
      ctx.fill();
    }
  }

  flowers.forEach((f) => drawFlower(ctx, f.offsetX, f.offsetY, f.color, f.bloomProgress, time));

  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: string,
  bloom: number,
  time: number
) {
  if (bloom <= 0) return;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.globalAlpha = Math.min(bloom * 2, 1);

  const petalSize = 5 * bloom;
  const rotation = time * 0.5 + bloom * 0.3;

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + rotation;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(petalSize * 0.8, 0, petalSize, petalSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, petalSize * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF176';
  ctx.fill();

  ctx.restore();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  plant: PlantData,
  time: number
) {
  const px = plant.gridX * GRID_SIZE + GRID_SIZE / 2;
  const py = plant.gridY * GRID_SIZE + GRID_SIZE / 2 + 20;

  ctx.save();

  ctx.beginPath();
  ctx.ellipse(px, py + 5, 18, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(62,39,25,0.35)';
  ctx.fill();

  switch (plant.type) {
    case PlantType.Cactus:
      drawCactus(ctx, px, py, plant.growthStage, plant.health, plant.flowers, time);
      break;
    case PlantType.Fern:
      drawFern(ctx, px, py, plant.growthStage, plant.health, plant.flowers, time);
      break;
    case PlantType.Orchid:
      drawOrchid(ctx, px, py, plant.growthStage, plant.health, plant.flowers, time);
      break;
  }

  ctx.restore();
}

function drawWaterParticles(
  ctx: CanvasRenderingContext2D,
  particles: WaterParticle[]
) {
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100,181,246,${alpha * 0.7})`;
    ctx.fill();
  });
}

function drawRainDrops(
  ctx: CanvasRenderingContext2D,
  drops: RainDrop[],
  w: number,
  h: number
) {
  ctx.strokeStyle = 'rgba(100,181,246,0.4)';
  ctx.lineWidth = 1.5;
  drops.forEach((d) => {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 1, d.y + d.length);
    ctx.stroke();
  });
}

function drawSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  plant: PlantData,
  time: number
) {
  const px = plant.gridX * GRID_SIZE + GRID_SIZE / 2;
  const py = plant.gridY * GRID_SIZE + GRID_SIZE / 2 + 20;
  const pulseR = 30 + Math.sin(time * 3) * 3;

  ctx.beginPath();
  ctx.arc(px, py - 15, pulseR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${0.3 + Math.sin(time * 3) * 0.15})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGridHighlight(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  hasPlant: boolean
) {
  const x = gridX * GRID_SIZE;
  const y = gridY * GRID_SIZE;
  ctx.fillStyle = hasPlant ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.2)';
  ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
  ctx.strokeStyle = hasPlant ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
}

export const GreenhouseCanvas: React.FC<GreenhouseCanvasProps> = ({
  plants,
  climate,
  weather,
  selectedPlantType,
  onPlacePlant,
  onSelectPlant,
  selectedPlantId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const waterParticlesRef = useRef<WaterParticle[]>([]);
  const rainDropsRef = useRef<RainDrop[]>([]);
  const hoverGridRef = useRef<{ x: number; y: number } | null>(null);
  const plantGridSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    plantGridSetRef.current = new Set(plants.map((p) => `${p.gridX},${p.gridY}`));
  }, [plants]);

  useEffect(() => {
    waterParticlesRef.current = [];
    plants.forEach((plant) => {
      if (plant.isWatered) {
        const px = plant.gridX * GRID_SIZE + GRID_SIZE / 2;
        const py = plant.gridY * GRID_SIZE + GRID_SIZE / 2;
        for (let i = 0; i < 30; i++) {
          waterParticlesRef.current.push({
            x: px + (Math.random() - 0.5) * 30,
            y: py - 10 + Math.random() * 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5 + 0.3,
            size: 2 + Math.random() * 3,
            life: 1500 + Math.random() * 500,
            maxLife: 2000,
          });
        }
      }
    });
  }, [plants.filter((p) => p.isWatered).length]);

  const getCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 800, h: 600 };
    const rect = canvas.parentElement!.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const { w, h } = getCanvasSize();
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [getCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const dt = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      timeRef.current = timestamp / 1000;

      if (dt > 200) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const { w, h } = getCanvasSize();
      const dpr = window.devicePixelRatio;
      ctx.save();
      ctx.scale(dpr, dpr);

      drawBackground(ctx, w, h, weather, timeRef.current);
      drawGrid(ctx, w, h);

      if (hoverGridRef.current && selectedPlantType !== null) {
        const hg = hoverGridRef.current;
        const hasPlant = plantGridSetRef.current.has(`${hg.x},${hg.y}`);
        drawGridHighlight(ctx, hg.x, hg.y, hasPlant);
      }

      const sortedPlants = [...plants].sort((a, b) => a.gridY - b.gridY);
      sortedPlants.forEach((plant) => drawPlant(ctx, plant, timeRef.current));

      const selectedPlant = plants.find((p) => p.id === selectedPlantId);
      if (selectedPlant) {
        drawSelectionHighlight(ctx, selectedPlant, timeRef.current);
      }

      waterParticlesRef.current = waterParticlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.01,
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0);
      drawWaterParticles(ctx, waterParticlesRef.current);

      if (weather === 'rainy') {
        if (rainDropsRef.current.length < 60) {
          rainDropsRef.current.push({
            x: Math.random() * w,
            y: -10,
            speed: 3 + Math.random() * 4,
            length: 8 + Math.random() * 10,
          });
        }
        rainDropsRef.current = rainDropsRef.current
          .map((d) => ({ ...d, y: d.y + d.speed }))
          .filter((d) => d.y < h + 20);
        drawRainDrops(ctx, rainDropsRef.current, w, h);
      } else {
        rainDropsRef.current = [];
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [plants, climate, weather, selectedPlantType, selectedPlantId, getCanvasSize]);

  const getGridPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        gridX: Math.floor(x / GRID_SIZE),
        gridY: Math.floor(y / GRID_SIZE),
      };
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const pos = getGridPos(e.clientX, e.clientY);
      if (!pos) return;

      const clickedPlant = plants.find(
        (p) => p.gridX === pos.gridX && p.gridY === pos.gridY
      );

      if (selectedPlantType !== null) {
        if (!clickedPlant) {
          onPlacePlant(pos.gridX, pos.gridY);
        } else {
          onSelectPlant(clickedPlant.id);
        }
      } else {
        if (clickedPlant) {
          onSelectPlant(clickedPlant.id);
        }
      }
    },
    [plants, selectedPlantType, onPlacePlant, onSelectPlant, getGridPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getGridPos(e.clientX, e.clientY);
      hoverGridRef.current = pos;
    },
    [getGridPos]
  );

  const handleMouseLeave = useCallback(() => {
    hoverGridRef.current = null;
  }, []);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: selectedPlantType !== null ? 'crosshair' : 'default' }}
      />
    </div>
  );
};
