import React, { useRef, useEffect, useCallback } from 'react';
import { GameManager, getGameManager } from '../engine/GameManager';
import { GameState, ElementType, RUNE_HEX_RADIUS, PORTAL_ROTATION_SPEED, ELEMENT_COLORS } from '../engine/types';
import { ParticleEffect } from './ParticleEffect';
import { easeOut } from './Animations';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

function drawGradientBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
  const area = state.areas[state.currentArea];
  if (!area) return;
  const [c1, c2] = area.info.gradientColors;
  const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#4A3728';
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_HEIGHT);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  for (let j = 0; j < CANVAS_HEIGHT; j += 40) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(CANVAS_WIDTH, j);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + rotation;
    const hx = x + radius * Math.cos(angle);
    const hy = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
}

function drawRunes(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const rune of state.runes) {
    if (rune.collected && rune.collectAnimProgress >= 1) continue;

    const t = easeOut(rune.collectAnimProgress);
    const px = rune.collected
      ? rune.position.x + (state.player.position.x - rune.position.x) * t
      : rune.position.x;
    const py = rune.collected
      ? rune.position.y + (state.player.position.y - rune.position.y) * t
      : rune.position.y;
    const scale = rune.collected ? 1 - t : 1;
    const radius = RUNE_HEX_RADIUS * scale;

    if (radius < 0.5) continue;

    const orbitOffset = 10;
    const ox = px + Math.cos(rune.orbitAngle) * orbitOffset;
    const oy = py + Math.sin(rune.orbitAngle) * orbitOffset;

    const color = ELEMENT_COLORS[rune.element];

    ctx.save();
    ctx.globalAlpha = rune.collected ? 1 - t : 0.7;

    drawHexagon(ctx, ox, oy, radius, rune.orbitAngle);
    ctx.fillStyle = color;
    ctx.globalAlpha *= 0.3;
    ctx.fill();

    ctx.globalAlpha = rune.collected ? 1 - t : 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = (rune.collected ? 1 - t : 0.4) * (0.5 + 0.5 * Math.sin(Date.now() / 300));
    const glowGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 2.5);
    glowGrad.addColorStop(0, color);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const p = state.player;
  const cx = p.position.x;
  const cy = p.position.y;

  ctx.save();

  const cloakOffset = p.isMoving ? Math.sin(p.cloakFrame * Math.PI / 3) * 4 : 0;
  const dirMultiplier = p.direction === 'LEFT' ? -1 : 1;

  ctx.fillStyle = '#2A1F3D';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 14, 10 + Math.abs(cloakOffset) * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3D2B56';
  ctx.beginPath();
  ctx.moveTo(cx - 10 * dirMultiplier, cy + 8);
  ctx.quadraticCurveTo(cx - 18 * dirMultiplier + cloakOffset * 0.3, cy + 18, cx - 14 * dirMultiplier + cloakOffset * 0.5, cy + 22);
  ctx.lineTo(cx + 2 * dirMultiplier, cy + 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F5DEB3';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1A0F2E';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 22);
  ctx.lineTo(cx - 12, cy - 6);
  ctx.lineTo(cx + 12, cy - 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2A1F3D';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 22);
  ctx.lineTo(cx - 16, cy + 2);
  ctx.lineTo(cx - 10, cy + 2);
  ctx.lineTo(cx, cy - 8);
  ctx.lineTo(cx + 10, cy + 2);
  ctx.lineTo(cx + 16, cy + 2);
  ctx.closePath();
  ctx.fill();

  const time = Date.now() / 200;
  for (let i = 0; i < 3; i++) {
    const px = cx + Math.cos(time + i * 2.1) * 6;
    const py = cy - 14 + Math.sin(time * 1.3 + i * 1.7) * 4;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time + i);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawPortal(ctx: CanvasRenderingContext2D, state: GameState): void {
  const area = state.areas[state.currentArea];
  if (!area?.hasPortal || !area.info.portalPosition) return;

  const portal = area.info.portalPosition;
  const time = Date.now() / 1000;
  const rotation = time * PORTAL_ROTATION_SPEED * (Math.PI / 180);

  ctx.save();
  ctx.translate(portal.x, portal.y);

  for (let ring = 3; ring >= 0; ring--) {
    const ringRadius = 20 + ring * 8;
    ctx.save();
    ctx.rotate(rotation * (ring % 2 === 0 ? 1 : -1));
    ctx.globalAlpha = 0.3 + ring * 0.1;
    ctx.strokeStyle = ring === 0 ? '#8B00FF' : '#4B0082';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#1A0033';
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + rotation * 0.5;
    const dist = 8 + Math.random() * 12;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;
    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#DDA0DD';
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTransition(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.transitioning) return;
  const progress = state.transitionProgress;
  let alpha: number;
  if (progress < 0.5) {
    alpha = progress * 2;
  } else {
    alpha = 1 - (progress - 0.5) * 2;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function drawProximityIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const rune of state.runes) {
    if (rune.collected) continue;
    const dx = state.player.position.x - rune.position.x;
    const dy = state.player.position.y - rune.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 50) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 200);
      ctx.fillStyle = '#F5E6C8';
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('按 E 收集', rune.position.x, rune.position.y - 28);
      ctx.restore();
    }
  }
}

function drawPortalIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.activePortal) return;
  const area = state.areas[state.currentArea];
  if (!area?.info.portalPosition) return;
  const portal = area.info.portalPosition;

  ctx.save();
  ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 300);
  ctx.fillStyle = '#FFD700';
  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.fillText('按 E 进入传送门', portal.x, portal.y - 40);
  ctx.restore();
}

interface GameCanvasProps {
  gameManager: GameManager;
  onStateUpdate: (state: GameState) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameManager, onStateUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef(new ParticleEffect());
  const stateRef = useRef<GameState>(gameManager.getState());
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const dt = Math.min(now - lastTimeRef.current, 50);
    lastTimeRef.current = now;

    gameManager.update(dt);
    const state = gameManager.getState();
    stateRef.current = state;

    particleRef.current.update(dt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGradientBackground(ctx, state);
    drawPortal(ctx, state);
    drawRunes(ctx, state);
    drawPlayer(ctx, state);
    drawProximityIndicator(ctx, state);
    drawPortalIndicator(ctx, state);
    particleRef.current.render(ctx);
    drawTransition(ctx, state);

    onStateUpdate(state);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameManager, onStateUpdate]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      particleRef.current.destroy();
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameManager.handleKeyDown(e.key);
      if (e.key.toLowerCase() === 'e') {
        const state = gameManager.getState();
        if (state.activePortal) {
          const result = gameManager.triggerPortal();
          if (result === 'victory') {
            onStateUpdate(gameManager.getState());
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameManager.handleKeyUp(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameManager, onStateUpdate]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        margin: 'auto',
        imageRendering: 'auto',
      }}
    />
  );
};

export default GameCanvas;
export { CANVAS_WIDTH, CANVAS_HEIGHT, ParticleEffect };
