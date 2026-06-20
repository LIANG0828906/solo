import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getWaveField, getCurrentTime, startEngine, stopEngine } from '../game-logic/GameEngine';
import {
  hexToPixel,
  pixelToHex,
  amplitudeToColor,
  getPathWaypoints,
  getCanvasSize,
  hexDistance,
  HEX_SIZE,
  HEX_HEIGHT,
  HEX_WIDTH,
  GRID_COLS,
  GRID_ROWS,
  SQRT3,
} from '../game-logic/WaveField';
import { CRYSTAL_CARDS, UPGRADE_COSTS } from './UIManager';
import type { Crystal, Monster } from '../../store/gameStore';

const BG_COLOR = '#0B0F19';
const GRID_LINE_COLOR = '#2A2E38';
const PATH_COLOR = 'rgba(100, 120, 180, 0.15)';
const PATH_LINE_COLOR = 'rgba(100, 140, 220, 0.4)';

function drawHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill?: string,
  stroke?: string,
  lineWidth?: number
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth || 0.5;
    ctx.stroke();
  }
}

function drawHexGrid(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = 0.5 / scale;
  const effectiveSize = HEX_SIZE / scale;

  for (let q = 0; q < GRID_COLS; q++) {
    for (let r = 0; r < GRID_ROWS; r++) {
      const { x, y } = hexToPixel(q, r);
      drawHex(ctx, x, y, effectiveSize, undefined, GRID_LINE_COLOR, 0.5 / scale);
    }
  }
}

function drawPath(ctx: CanvasRenderingContext2D, scale: number) {
  const waypoints = getPathWaypoints();

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    const dq = end.x - start.x;
    const dr = end.y - start.y;
    const len = Math.sqrt(dq * dq + dr * dr);
    const steps = Math.ceil(len / (HEX_SIZE * 1.5));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = start.x + dq * t;
      const py = start.y + dr * t;
      const hex = pixelToHex(px, py);
      const center = hexToPixel(hex.q, hex.r);
      drawHex(ctx, center.x, center.y, HEX_SIZE / scale - 0.5, PATH_COLOR);
    }
  }

  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.strokeStyle = PATH_LINE_COLOR;
  ctx.lineWidth = 2 / scale;
  ctx.setLineDash([6 / scale, 4 / scale]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWaveField(ctx: CanvasRenderingContext2D, scale: number) {
  const field = getWaveField();
  if (!field || field.amplitudes.length === 0) return;

  for (let cq = 0; cq < field.cols; cq++) {
    for (let cr = 0; cr < field.rows; cr++) {
      const amp = field.amplitudes[cq * field.rows + cr];
      if (Math.abs(amp) < 0.05) continue;

      const gq = cq * field.step;
      const gr = cr * field.step;
      const { x, y } = hexToPixel(gq, gr);
      const color = amplitudeToColor(amp);
      if (color === 'transparent') continue;

      drawHex(ctx, x, y, HEX_SIZE / scale - 0.3, color);
    }
  }
}

function drawCrystals(ctx: CanvasRenderingContext2D, crystals: Crystal[], scale: number, time: number) {
  for (const crystal of crystals) {
    const { x, y } = hexToPixel(crystal.q, crystal.r);
    const color = crystal.type === 'high' ? '#FF6B35' : '#3A0CA3';
    const glowColor = crystal.type === 'high' ? 'rgba(255,107,53,0.3)' : 'rgba(58,12,163,0.3)';

    if (crystal.upgraded) {
      const pulseSize = HEX_SIZE / scale + 4 + Math.sin(time * 3) * 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / scale;
      ctx.globalAlpha = 0.4 + Math.sin(time * 4) * 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const hexSize = HEX_SIZE / scale * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 6);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = hexSize * Math.cos(angle);
      const hy = hexSize * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, HEX_SIZE / scale * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    const radiusPx = crystal.baseRadius * HEX_WIDTH * 0.75;
    ctx.beginPath();
    ctx.arc(x, y, radiusPx / scale, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawMonsters(ctx: CanvasRenderingContext2D, monsters: Monster[], scale: number) {
  for (const monster of monsters) {
    if (monster.dead || monster.escaped) continue;

    const { x, y } = monster;
    let color: string;
    let size: number;

    switch (monster.type) {
      case 'fast':
        color = '#FFD700';
        size = 5 / scale;
        break;
      case 'heavy':
        color = '#8B4513';
        size = 9 / scale;
        break;
      default:
        color = '#4CAF50';
        size = 7 / scale;
    }

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (monster.damageMultiplier > 1) {
      ctx.beginPath();
      ctx.arc(x, y, size + 2 / scale, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1 / scale;
      ctx.stroke();
    }

    const hpRatio = monster.hp / monster.maxHp;
    const barWidth = 14 / scale;
    const barHeight = 2 / scale;
    const barX = x - barWidth / 2;
    const barY = y - size - 4 / scale;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, scale: number, time: number) {
  const state = useGameStore.getState();
  for (const p of state.particles) {
    const elapsed = time - p.birthTime;
    if (elapsed >= p.duration) continue;

    const progress = elapsed / p.duration;
    const alpha = 1 - progress;
    const radius = 3 + progress * 8;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius / scale, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + progress * Math.PI;
      const dist = radius * 1.5 * progress;
      const px = p.x + Math.cos(angle) * dist / scale;
      const py = p.y + Math.sin(angle) * dist / scale;
      ctx.beginPath();
      ctx.arc(px, py, 2 / scale, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawBeacon(ctx: CanvasRenderingContext2D, scale: number, time: number) {
  const state = useGameStore.getState();
  if (state.gamePhase !== 'playing') return;
  if (!state.waveInfo.beaconActive) return;

  const waypoints = getPathWaypoints();
  const entry = waypoints[0];
  const beaconElapsed = time - state.waveInfo.beaconStartTime;

  if (beaconElapsed < 1.5 && state.waveInfo.monstersSpawned < state.waveInfo.monstersInWave) {
    const pulse = Math.sin(time * Math.PI * 4) * 0.5 + 0.5;
    const radius = 12 + pulse * 8;

    ctx.beginPath();
    ctx.arc(entry.x, entry.y, radius / scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,50,${0.3 + pulse * 0.4})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,200,50,${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
  }
}

function drawExitVortex(ctx: CanvasRenderingContext2D, scale: number, time: number) {
  const waypoints = getPathWaypoints();
  const exit = waypoints[waypoints.length - 1];

  const rotation = time * 1.5;

  ctx.save();
  ctx.translate(exit.x, exit.y);
  ctx.rotate(rotation);

  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const spiralR = 6 + Math.sin(time * 2 + i) * 3;
    ctx.beginPath();
    ctx.arc(0, 0, spiralR / scale, angle, angle + Math.PI / 3);
    ctx.strokeStyle = `rgba(138,43,226,${0.5 + Math.sin(time * 3 + i) * 0.3})`;
    ctx.lineWidth = 2 / scale;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 4 / scale, 0, Math.PI * 2);
  ctx.fillStyle = '#9B59B6';
  ctx.fill();

  ctx.restore();
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderFrameRef = useRef<number | null>(null);
  const selectedCrystalIdRef = useRef<string | null>(null);

  const gamePhase = useGameStore((s) => s.gamePhase);
  const selectedCrystalType = useGameStore((s) => s.selectedCrystalType);
  const setSelectedCrystalType = useGameStore((s) => s.setSelectedCrystalType);
  const placeCrystal = useGameStore((s) => s.placeCrystal);
  const upgradeCrystal = useGameStore((s) => s.upgradeCrystal);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = useGameStore.getState();
    const time = getCurrentTime();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;

    if (canvas.width !== Math.round(displayW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
    }

    const gameSize = getCanvasSize();
    const scaleX = displayW / gameSize.width;
    const scaleY = displayH / gameSize.height;
    const scale = Math.min(scaleX, scaleY);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayW, displayH);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, displayW, displayH);

    ctx.save();
    const offsetX = (displayW - gameSize.width * scale) / 2;
    const offsetY = (displayH - gameSize.height * scale) / 2;
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawPath(ctx, scale);
    drawWaveField(ctx, scale);
    drawHexGrid(ctx, scale);
    drawCrystals(ctx, state.crystals, scale, time);
    drawMonsters(ctx, state.monsters, scale);
    drawParticles(ctx, scale, time);
    drawBeacon(ctx, scale, time);
    drawExitVortex(ctx, scale, time);

    if (state.gamePhase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, gameSize.width, gameSize.height);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#F1F2F6';
      ctx.textAlign = 'center';
      ctx.fillText('共鸣回廊', gameSize.width / 2, gameSize.height / 2 - 30);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#8B8FA3';
      ctx.fillText('点击开始游戏', gameSize.width / 2, gameSize.height / 2 + 10);
    }

    ctx.restore();

    renderFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    renderFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (renderFrameRef.current) cancelAnimationFrame(renderFrameRef.current);
    };
  }, [render]);

  useEffect(() => {
    if (gamePhase === 'playing' || gamePhase === 'waveBreak') {
      startEngine();
    }
    return () => {
      stopEngine();
    };
  }, [gamePhase]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const state = useGameStore.getState();

      if (state.gamePhase === 'idle') {
        startGame();
        return;
      }

      if (state.gamePhase === 'won' || state.gamePhase === 'lost') {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const gameSize = getCanvasSize();
      const scaleX = rect.width / gameSize.width;
      const scaleY = rect.height / gameSize.height;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (rect.width - gameSize.width * scale) / 2;
      const offsetY = (rect.height - gameSize.height * scale) / 2;

      const gameX = (px - offsetX) / scale;
      const gameY = (py - offsetY) / scale;

      const hex = pixelToHex(gameX, gameY);

      const existingCrystal = state.crystals.find(
        (c) => hexDistance(hex.q, hex.r, c.q, c.r) === 0
      );

      if (existingCrystal) {
        selectedCrystalIdRef.current = existingCrystal.id;
        return;
      }

      if (state.selectedCrystalType) {
        placeCrystal(hex.q, hex.r);
      }
    },
    [startGame, placeCrystal]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: BG_COLOR,
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: selectedCrystalType ? 'crosshair' : 'default',
        }}
      />
    </div>
  );
};

export default GameCanvas;
