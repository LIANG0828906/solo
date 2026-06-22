import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { WorldSnapshot } from '../game/World';
import {
  TrashItem, TrashType, RecyclingStation, Obstacle, Particle,
  TRASH_COLORS, STATION_COLORS, STATION_LABELS,
} from '../game/types';

interface GameCanvasProps {
  engine: GameEngine;
  onSnapshot: (snap: WorldSnapshot) => void;
}

const CANVAS_W = 640;
const CANVAS_H = 480;
const CAMERA_EASE = 0.05;

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onSnapshot }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ x: 0, y: 0 });
  const snapRef = useRef<WorldSnapshot | null>(null);
  const hoverRef = useRef<{ type: string; label: string; x: number; y: number } | null>(null);
  const scanLineRef = useRef(0);

  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, snap: WorldSnapshot) => {
    const cam = camRef.current;
    const targetCamX = snap.playerX - CANVAS_W / 2;
    const targetCamY = snap.playerY - CANVAS_H / 2;
    cam.x += (targetCamX - cam.x) * CAMERA_EASE;
    cam.y += (targetCamY - cam.y) * CAMERA_EASE;
    cam.x = Math.max(0, Math.min(640 - CANVAS_W, cam.x));
    cam.y = Math.max(0, Math.min(480 - CANVAS_H, cam.y));

    const sx = snap.screenShake.offsetX;
    const sy = snap.screenShake.offsetY;
    ctx.save();
    ctx.translate(sx, sy);

    const waterDarken = Math.min(snap.waterLevel * 0.05, 0.4);
    const topR = 0x87, topG = 0xCE, topB = 0xEB;
    const botR = Math.floor(0x0B * (1 + waterDarken));
    const botG = Math.floor(0x3D * (1 - waterDarken * 0.3));
    const botB = Math.floor(0x91 * (1 - waterDarken * 0.2));
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, `rgb(${topR},${topG},${topB})`);
    grad.addColorStop(1, `rgb(${botR},${botG},${botB})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const p of snap.particles) {
      if (p.type === 'microbe') {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    for (const obs of snap.obstacles) {
      drawObstacle(ctx, obs, cam.x, cam.y);
    }

    for (const item of snap.trashItems) {
      drawTrash(ctx, item, cam.x, cam.y);
    }

    for (const station of snap.recyclingStations) {
      drawStation(ctx, station, cam.x, cam.y);
    }

    drawSubmarine(ctx, snap.playerX - cam.x, snap.playerY - cam.y, snap.playerHitTimer > 0, snap.playerStripes, scanLineRef.current);

    for (const p of snap.particles) {
      if (p.type === 'bubble') {
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    if (snap.event) {
      const evtAlpha = Math.min(1, snap.event.timer, (snap.event.maxTimer - snap.event.timer) * 2);
      ctx.globalAlpha = Math.max(0, evtAlpha) * 0.5;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
      ctx.globalAlpha = 1;
    }

    if (hoverRef.current) {
      const h = hoverRef.current;
      ctx.font = '14px Poppins, sans-serif';
      const textW = ctx.measureText(h.label).width;
      const px = h.x + 10;
      const py = h.y - 20;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, px - 4, py - 14, textW + 8, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#333333';
      ctx.fillText(h.label, px, py);
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    engine.setOnStateUpdate((snap) => {
      snapRef.current = snap;
      onSnapshot(snap);
    });
    engine.start();
    return () => engine.stop();
  }, [engine, onSnapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderLoop = () => {
      const snap = snapRef.current;
      if (snap) {
        scanLineRef.current = (scanLineRef.current + 0.5) % 12;
        renderFrame(ctx, snap);
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    engine.input.mouseX = mx;
    engine.input.mouseY = my;

    const cam = camRef.current;
    const worldX = mx + cam.x;
    const worldY = my + cam.y;

    hoverRef.current = null;

    const snap = snapRef.current;
    if (!snap) return;

    for (const station of snap.recyclingStations) {
      const sx = station.x - cam.x;
      const sy = station.y - cam.y;
      if (mx >= sx && mx <= sx + station.width && my >= sy && my <= sy + station.height) {
        hoverRef.current = { type: 'station', label: STATION_LABELS[station.type], x: mx, y: my };
        return;
      }
    }

    for (const item of snap.trashItems) {
      if (item.collecting) continue;
      const ix = item.x - cam.x;
      const iy = item.y - cam.y;
      if (Math.abs(mx - ix) < 16 && Math.abs(my - iy) < 16) {
        const labels: Record<TrashType, string> = { plastic: '塑料瓶', rubber: '轮胎', metal: '铝罐', fabric: '渔网' };
        hoverRef.current = { type: 'trash', label: labels[item.type], x: mx, y: my };
        return;
      }
    }
  }, [engine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': engine.input.up = true; break;
      case 'ArrowDown': case 's': case 'S': engine.input.down = true; break;
      case 'ArrowLeft': case 'a': case 'A': engine.input.left = true; break;
      case 'ArrowRight': case 'd': case 'D': engine.input.right = true; break;
      case ' ': engine.input.collect = true; break;
      case 'e': case 'E':
        const snap = snapRef.current;
        if (snap) {
          for (const station of snap.recyclingStations) {
            const dx = station.x + station.width / 2 - snap.playerX;
            const dy = station.y + station.height / 2 - snap.playerY;
            if (dx * dx + dy * dy < 60 * 60) {
              engine.input.deposit = true;
              engine.input.depositType = station.type;
              break;
            }
          }
        }
        break;
    }
  }, [engine]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': engine.input.up = false; break;
      case 'ArrowDown': case 's': case 'S': engine.input.down = false; break;
      case 'ArrowLeft': case 'a': case 'A': engine.input.left = false; break;
      case 'ArrowRight': case 'd': case 'D': engine.input.right = false; break;
      case ' ': engine.input.collect = false; break;
    }
  }, [engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ border: '2px solid #1a1a5e', borderRadius: '8px', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      tabIndex={0}
    />
  );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSubmarine(ctx: CanvasRenderingContext2D, x: number, y: number, hit: boolean, stripes: number, scanY: number) {
  ctx.save();
  ctx.translate(x, y);

  if (hit) {
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
  }

  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(-18, -8);
  ctx.lineTo(12, -10);
  ctx.lineTo(16, -6);
  ctx.lineTo(16, 6);
  ctx.lineTo(12, 10);
  ctx.lineTo(-18, 8);
  ctx.closePath();
  ctx.fill();

  if (stripes > 0) {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < stripes && i < 3; i++) {
      const sx = -10 + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx, -6);
      ctx.lineTo(sx, 6);
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
  ctx.beginPath();
  ctx.ellipse(6, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(173, 216, 230, 0.8)';
  ctx.lineWidth = 1;
  const scanOffset = scanY % 10 - 5;
  ctx.beginPath();
  ctx.moveTo(0, scanOffset);
  ctx.lineTo(12, scanOffset);
  ctx.stroke();

  ctx.fillStyle = '#555555';
  ctx.fillRect(-18, -2, -8, 4);

  ctx.restore();
}

function drawTrash(ctx: CanvasRenderingContext2D, item: TrashItem, camX: number, camY: number) {
  ctx.save();
  const x = item.x - camX;
  const y = item.y - camY;
  ctx.translate(x, y);
  ctx.rotate(item.rotation);
  ctx.scale(item.scale, item.scale);

  switch (item.type) {
    case 'plastic':
      ctx.fillStyle = '#90EE90';
      roundRect(ctx, -5, -12, 10, 20, 3);
      ctx.fill();
      ctx.fillStyle = '#006400';
      roundRect(ctx, -3, -12, 6, 4, 2);
      ctx.fill();
      break;
    case 'rubber':
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'metal':
      ctx.fillStyle = '#C0C0C0';
      roundRect(ctx, -5, -10, 10, 20, 3);
      ctx.fill();
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(-4, -6, 8, 2);
      ctx.fillStyle = '#A0A0A0';
      roundRect(ctx, -5, -10, 10, 3, 1);
      ctx.fill();
      break;
    case 'fabric':
      ctx.strokeStyle = 'rgba(210, 180, 140, 0.7)';
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, -10);
        ctx.lineTo(i, 10);
        ctx.stroke();
      }
      for (let j = -8; j <= 8; j += 4) {
        ctx.beginPath();
        ctx.moveTo(-10, j);
        ctx.lineTo(10, j);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
      ctx.fillRect(-10, -10, 20, 20);
      break;
  }

  ctx.restore();
}

function drawStation(ctx: CanvasRenderingContext2D, station: RecyclingStation, camX: number, camY: number) {
  const x = station.x - camX;
  const y = station.y - camY;
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 40, 0.6)';
  roundRect(ctx, x, y, station.width, station.height, 8);
  ctx.fill();

  ctx.fillStyle = STATION_COLORS[station.type];
  roundRect(ctx, x + 4, y + 4, station.width - 8, station.height - 12, 4);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '10px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${station.recycled}`, x + station.width / 2, y + station.height - 2);

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  ctx.save();
  switch (obs.type) {
    case 'reef': {
      const rx = obs.x - camX;
      const ry = obs.y - camY;
      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.moveTo(rx, ry + obs.height);
      ctx.lineTo(rx + obs.width * 0.3, ry + 5);
      ctx.lineTo(rx + obs.width * 0.5, ry + obs.height * 0.3);
      ctx.lineTo(rx + obs.width * 0.7, ry);
      ctx.lineTo(rx + obs.width, ry + obs.height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6B5335';
      ctx.beginPath();
      ctx.arc(rx + obs.width * 0.5, ry + obs.height * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'jellyfish': {
      if (!obs.jellyfishes) break;
      for (const jf of obs.jellyfishes) {
        const jx = jf.x - camX;
        const jy = jf.y - camY;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(jx, jy, 8, 6, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let t = 0; t < 3; t++) {
          ctx.beginPath();
          ctx.moveTo(jx - 4 + t * 4, jy);
          ctx.quadraticCurveTo(jx - 2 + t * 4, jy + 8, jx - 4 + t * 4, jy + 14);
          ctx.stroke();
        }
      }
      break;
    }
    case 'oil': {
      const ox = obs.x - camX;
      const oy = obs.y - camY;
      ctx.fillStyle = 'rgba(40, 30, 20, 0.6)';
      ctx.beginPath();
      ctx.ellipse(ox + obs.width / 2, oy + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60, 50, 30, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ox + obs.width * 0.4, oy + obs.height * 0.4, obs.width * 0.25, obs.height * 0.25, 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

export default GameCanvas;
