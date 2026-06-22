import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../game/store';
import { updatePhysics, GRAVITY, MAP_BOUNDS_Y } from '../game/physicsModule';
import { loadLevel, processCollisionEvents } from '../game/levelModule';
import { createShadowClone, updateShadowPositions, findNearestShadowAt } from '../game/shadowModule';
import { computePlayerVelocity, updatePlayerFacing, InputState, DragState, startDrag, updateDrag, endDrag } from '../game/playerModule';
import { ShadowClone, Particle, Vec2 } from '../game/types';

const FIXED_DT = 1 / 60;
const CANVAS_W = 800;
const CANVAS_H = 600;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const inputRef = useRef<InputState>({ left: false, right: false, up: false, jump: false });
  const dragRef = useRef<DragState>({ isDragging: false, startPos: null, currentPos: null });
  const accumulatorRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const portalPhaseRef = useRef<number>(0);
  const trapPhaseRef = useRef<number>(0);
  const [scale, setScale] = useState(1);

  const store = useGameStore();

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const maxW = 960;
    const s = Math.min(w, maxW) / CANVAS_W;
    setScale(s);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const input = inputRef.current;
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': input.left = true; break;
        case 'KeyD': case 'ArrowRight': input.right = true; break;
        case 'KeyW': case 'ArrowUp': input.up = true; break;
        case 'Space': input.jump = true; e.preventDefault(); break;
        case 'KeyR': store.dispatch({ type: 'RESET_LEVEL' }); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const input = inputRef.current;
      switch (e.code) {
        case 'KeyA': case 'ArrowLeft': input.left = false; break;
        case 'KeyD': case 'ArrowRight': input.right = false; break;
        case 'KeyW': case 'ArrowUp': input.up = false; break;
        case 'Space': input.jump = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [store]);

  const canvasToWorld = useCallback((clientX: number, clientY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    return { x, y };
  }, [scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const pos = canvasToWorld(e.clientX, e.clientY);
        dragRef.current = startDrag(pos);
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        const pos = canvasToWorld(e.clientX, e.clientY);
        dragRef.current = updateDrag(dragRef.current, pos);
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        const result = endDrag(dragRef.current);
        if (result.released && result.endPos && store.player.isAlive) {
          const shadow = createShadowClone(store.player, result.endPos);
          store.dispatch({ type: 'ADD_SHADOW', shadow });
          store.dispatch({ type: 'INCREMENT_SHADOW_PLACEMENTS' });
        }
        dragRef.current = { isDragging: false, startPos: null, currentPos: null };
      }
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (dragRef.current.isDragging) return;
      const pos = canvasToWorld(e.clientX, e.clientY);
      const nearest = findNearestShadowAt(store.shadows, pos);
      if (nearest) {
        store.dispatch({ type: 'REMOVE_SHADOW', id: nearest.id });
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [scale, store]);

  useEffect(() => {
    if (store.gamePhase !== 'playing' && store.gamePhase !== 'transition') return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    const gameLoop = (now: number) => {
      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 0.1);
      accumulatorRef.current += dt;

      while (accumulatorRef.current >= FIXED_DT) {
        if (store.player.isAlive && store.level && store.gamePhase === 'playing') {
          const input = inputRef.current;
          const pFacing = updatePlayerFacing(store.player, input);
          store.dispatch({ type: 'UPDATE_PLAYER', player: { facingRight: pFacing.facingRight } });

          const vel = computePlayerVelocity(store.player, input);
          const result = updatePhysics(
            store.player,
            store.level.blocks,
            store.level.platforms,
            store.level.movingPlatforms,
            store.shadows,
            store.level.traps,
            store.level.doors,
            store.level.pressurePlates,
            store.level.exitPortal,
            vel,
            FIXED_DT
          );

          store.dispatch({ type: 'UPDATE_PLAYER', player: result.player });

          for (const b of result.blocks) {
            store.dispatch({ type: 'UPDATE_BLOCK', id: b.id, data: { pos: b.pos, vel: b.vel, isGrounded: b.isGrounded } });
          }

          for (const mp of result.movingPlatforms) {
            store.dispatch({ type: 'UPDATE_MOVING_PLATFORM', id: mp.id, data: { pos: mp.pos, progress: mp.progress, direction: mp.direction } });
          }

          const updatedShadows = updateShadowPositions(store.shadows, result.player);
          for (const s of updatedShadows) {
            store.dispatch({ type: 'UPDATE_SHADOW_RECT', id: s.id, shadowRect: s.shadowRect });
          }

          const levelResult = processCollisionEvents(
            result.collisionEvents,
            store.level.pressurePlates,
            updatedShadows,
            result.blocks,
            result.player.pos,
            result.player.radius
          );

          for (const p of levelResult.plates) {
            store.dispatch({ type: 'UPDATE_PLATE', id: p.id, activated: p.activated });
          }
          for (const d of levelResult.doors) {
            store.dispatch({ type: 'UPDATE_DOOR', id: d.id, open: d.open });
          }

          if (levelResult.playerDied) {
            store.dispatch({ type: 'KILL_PLAYER' });
          }
          if (levelResult.playerExited) {
            store.dispatch({ type: 'COMPLETE_LEVEL', levelId: store.level.id });
            store.dispatch({ type: 'SET_PHASE', phase: 'victory' });
          }

          const camX = Math.max(0, Math.min(result.player.pos.x - CANVAS_W / 2, (store.level.width - CANVAS_W)));
          const camY = Math.max(0, Math.min(result.player.pos.y - CANVAS_H / 2, (store.level.height - CANVAS_H)));
          store.dispatch({ type: 'SET_CAMERA', camera: { x: camX, y: camY } });
        }

        accumulatorRef.current -= FIXED_DT;
      }

      portalPhaseRef.current += dt;
      trapPhaseRef.current += dt;

      render(ctx, store, portalPhaseRef.current, trapPhaseRef.current, dragRef.current);

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [store.gamePhase]);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          imageRendering: 'pixelated',
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}

function render(
  ctx: CanvasRenderingContext2D,
  store: ReturnType<typeof useGameStore.getState>,
  portalPhase: number,
  trapPhase: number,
  drag: DragState
) {
  const { player, shadows, level, camera } = store;
  if (!level) return;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#1C1C2E';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  drawLightMask(ctx, player);

  for (const p of level.platforms) {
    drawPlatform(ctx, p.pos.x, p.pos.y, p.width, p.height, player);
  }
  for (const mp of level.movingPlatforms) {
    drawMovingPlatform(ctx, mp.pos.x, mp.pos.y, mp.width, mp.height, player);
  }
  for (const d of level.doors) {
    drawDoor(ctx, d, player);
  }
  for (const b of level.blocks) {
    drawBlock(ctx, b.pos.x, b.pos.y, b.width, b.height, player);
  }
  for (const p of level.pressurePlates) {
    drawPressurePlate(ctx, p, player);
  }
  for (const t of level.traps) {
    drawTrap(ctx, t, trapPhase, player);
  }
  if (level.exitPortal) {
    drawExitPortal(ctx, level.exitPortal, portalPhase, player);
  }
  for (const s of shadows) {
    drawShadowClone(ctx, s);
  }

  if (player.isAlive) {
    drawPlayer(ctx, player);
  }

  if (drag.isDragging && drag.startPos && drag.currentPos) {
    ctx.strokeStyle = 'rgba(204, 204, 204, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(drag.startPos.x, drag.startPos.y);
    ctx.lineTo(drag.currentPos.x, drag.currentPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(drag.currentPos.x, drag.currentPos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(204, 204, 204, 0.3)';
    ctx.fill();
  }

  ctx.restore();

  drawHUD(ctx, store);
}

function drawLightMask(ctx: CanvasRenderingContext2D, player: { pos: { x: number; y: number }; radius: number }) {
  const { x, y } = player.pos;
  const glowRadius = 80;
  const gradient = ctx.createRadialGradient(x, y, player.radius, x, y, glowRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
}

function isInLight(objX: number, objY: number, objW: number, objH: number, player: { pos: { x: number; y: number } }): boolean {
  const cx = objX + objW / 2;
  const cy = objY + objH / 2;
  const dx = cx - player.pos.x;
  const dy = cy - player.pos.y;
  return Math.sqrt(dx * dx + dy * dy) < 200;
}

function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(x, y, w, h, player);
  ctx.fillStyle = lit ? '#3A3A5C' : '#1E1E30';
  ctx.fillRect(x, y, w, h);
  if (lit) {
    ctx.strokeStyle = '#4A4A6C';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawMovingPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(x, y, w, h, player);
  ctx.fillStyle = lit ? '#2A5A6A' : '#1A3A4A';
  ctx.fillRect(x, y, w, h);
  if (lit) {
    ctx.strokeStyle = '#3A7A8A';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    const midX = x + w / 2;
    ctx.fillStyle = '#5ABACA';
    ctx.fillRect(midX - 4, y + 3, 8, 3);
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(x, y, w, h, player);
  ctx.fillStyle = lit ? '#6B5B3A' : '#3A3220';
  ctx.fillRect(x, y, w, h);
  if (lit) {
    ctx.strokeStyle = '#8B7B5A';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawPressurePlate(ctx: CanvasRenderingContext2D, plate: { pos: { x: number; y: number }; width: number; height: number; activated: boolean }, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(plate.pos.x, plate.pos.y, plate.width, plate.height, player);
  const baseColor = plate.activated ? '#00FF88' : (lit ? '#555566' : '#2A2A3A');
  ctx.fillStyle = baseColor;
  ctx.fillRect(plate.pos.x, plate.pos.y, plate.width, plate.height);
  if (plate.activated) {
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 10;
    ctx.fillRect(plate.pos.x, plate.pos.y, plate.width, plate.height);
    ctx.shadowBlur = 0;
  }
}

function drawTrap(ctx: CanvasRenderingContext2D, trap: { pos: { x: number; y: number }; width: number; height: number }, phase: number, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(trap.pos.x, trap.pos.y, trap.width, trap.height, player);
  const flicker = Math.sin(phase * 8) * 0.3 + 0.7;
  const alpha = lit ? flicker : flicker * 0.3;
  ctx.fillStyle = `rgba(255, 0, 68, ${alpha})`;
  ctx.beginPath();
  const cx = trap.pos.x + trap.width / 2;
  const cy = trap.pos.y;
  for (let i = 0; i < 5; i++) {
    const sx = trap.pos.x + (trap.width / 5) * i;
    const tipX = sx + trap.width / 10;
    const tipY = cy - (i % 2 === 0 ? trap.height : trap.height * 0.5);
    if (i === 0) ctx.moveTo(sx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + trap.width / 5, cy);
  }
  ctx.closePath();
  ctx.fill();
}

function drawExitPortal(ctx: CanvasRenderingContext2D, portal: { pos: { x: number; y: number }; radius: number }, phase: number, player: { pos: { x: number; y: number } }) {
  const lit = isInLight(portal.pos.x, portal.pos.y, portal.radius * 2, portal.radius * 2, player);
  const pulse = Math.sin(phase * Math.PI * 2) * 0.3 + 0.7;
  const r = portal.radius * pulse;
  const gradient = ctx.createRadialGradient(portal.pos.x, portal.pos.y, 0, portal.pos.x, portal.pos.y, r);
  if (lit) {
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
    gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  }
  ctx.beginPath();
  ctx.arc(portal.pos.x, portal.pos.y, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(portal.pos.x, portal.pos.y, portal.radius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = lit ? '#FFD700' : '#8B7500';
  ctx.fill();
}

function drawDoor(ctx: CanvasRenderingContext2D, door: { pos: { x: number; y: number }; width: number; height: number; open: boolean }, player: { pos: { x: number; y: number } }) {
  if (door.open) return;
  const lit = isInLight(door.pos.x, door.pos.y, door.width, door.height, player);
  ctx.fillStyle = lit ? '#8B4513' : '#4A2A0A';
  ctx.fillRect(door.pos.x, door.pos.y, door.width, door.height);
  if (lit) {
    ctx.strokeStyle = '#A0603A';
    ctx.lineWidth = 1;
    ctx.strokeRect(door.pos.x, door.pos.y, door.width, door.height);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(door.pos.x + door.width - 5, door.pos.y + door.height / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShadowClone(ctx: CanvasRenderingContext2D, shadow: ShadowClone) {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#CCCCCC';
  ctx.beginPath();
  ctx.arc(shadow.pos.x, shadow.pos.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const sr = shadow.shadowRect;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#333333';
  ctx.fillRect(sr.x, sr.y, sr.width, sr.height);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(51, 51, 51, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(shadow.pos.x, shadow.pos.y);
  ctx.lineTo(sr.x + (shadow.direction.x > 0 ? 0 : sr.width), sr.y + sr.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: { pos: { x: number; y: number }; radius: number; facingRight: boolean }) {
  const gradient = ctx.createRadialGradient(player.pos.x, player.pos.y, 0, player.pos.x, player.pos.y, player.radius);
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.7, '#EEEEFF');
  gradient.addColorStop(1, '#AAAACC');
  ctx.beginPath();
  ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  const glowGradient = ctx.createRadialGradient(player.pos.x, player.pos.y, player.radius, player.pos.x, player.pos.y, 80);
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  glowGradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.05)');
  glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.beginPath();
  ctx.arc(player.pos.x, player.pos.y, 80, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();

  const eyeOffsetX = player.facingRight ? 4 : -4;
  ctx.fillStyle = '#333355';
  ctx.beginPath();
  ctx.arc(player.pos.x + eyeOffsetX - 2, player.pos.y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.pos.x + eyeOffsetX + 3, player.pos.y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD(ctx: CanvasRenderingContext2D, store: ReturnType<typeof useGameStore.getState>) {
  if (!store.level) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_W, 30);
  ctx.fillStyle = '#E0E0E0';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`关卡 ${store.level.id}: ${store.level.name}`, 10, 20);
  ctx.textAlign = 'center';
  ctx.fillText(`影子: ${store.shadows.length}`, CANVAS_W / 2, 20);
  ctx.textAlign = 'right';
  const elapsed = ((Date.now() - store.stats.startTime) / 1000).toFixed(1);
  ctx.fillText(`用时: ${elapsed}s`, CANVAS_W - 10, 20);
  ctx.textAlign = 'left';
}
