import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import { CANVAS_W, CANVAS_H, renderScene } from '../uiRenderer';
import { stepPhysics } from '../physicsEngine';
import { detectAllCollisions } from '../collisionDetector';
import { getLevelConfig, hasAllTriggersActivated } from '../levelManager';
import { CollisionResult, Mechanism, PortalMechanism, Vector2D } from '../types';
import { HUD } from './HUD';
import { ControlButtons } from './ControlButtons';

const FIXED_STEP = 16.67;

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const portalCooldownRef = useRef<Map<string, number>>(new Map());
  const wonRef = useRef<boolean>(false);

  const store = useGameStore;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const onResize = () => {
      const vw = window.innerWidth;
      let s = 1;
      if (vw < 900) {
        s = Math.min(1, (vw * 0.9) / CANVAS_W);
      }
      setScale(s);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = CANVAS_W * dpr;
      canvas.height = CANVAS_H * dpr;
      canvas.style.width = `${CANVAS_W}px`;
      canvas.style.height = `${CANVAS_H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const getCanvasPoint = (e: MouseEvent | React.MouseEvent): Vector2D => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
        y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
      };
    };

    const onDown = (e: MouseEvent) => {
      const st = store.getState();
      if (st.levelWon) return;
      st.startDrag(getCanvasPoint(e));
    };
    const onMove = (e: MouseEvent) => {
      const st = store.getState();
      if (st.interactionMode !== 'dragging') return;
      st.updateDrag(getCanvasPoint(e));
    };
    const onUp = () => {
      const st = store.getState();
      if (st.interactionMode === 'dragging') {
        st.releaseDrag();
      }
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    lastTimeRef.current = performance.now();
    startTimeRef.current = performance.now();
    portalCooldownRef.current = new Map();
    wonRef.current = false;

    const tick = (now: number) => {
      const st = store.getState();
      if (st.currentView !== 'playing') {
        lastTimeRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const realDt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumulatorRef.current += Math.min(100, realDt);

      while (accumulatorRef.current >= FIXED_STEP) {
        runPhysicsStep();
        accumulatorRef.current -= FIXED_STEP;
      }

      store.getState().updateParticles(realDt);

      const renderState = store.getState();
      renderScene(ctx, {
        pendulum: renderState.pendulum,
        mechanisms: renderState.mechanisms,
        particles: renderState.particles,
        dragStart: renderState.dragStart,
        dragCurrent: renderState.dragCurrent,
        timeSec: renderState.gameTimeSec,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    const runPhysicsStep = () => {
      const st = store.getState();
      if (st.levelWon) return;

      const elapsedMs = performance.now() - startTimeRef.current;
      const timeSec = elapsedMs / 1000;
      st.updateMechanisms(timeSec);
      st.updateTime(FIXED_STEP);

      const afterTime = store.getState();
      const cfg = getLevelConfig(afterTime.currentLevelIndex);
      if (cfg.timeLimit && afterTime.timeRemaining <= 0) {
        st.resetLevel();
        startTimeRef.current = performance.now();
        portalCooldownRef.current = new Map();
        wonRef.current = false;
        return;
      }

      if (afterTime.interactionMode !== 'swinging') return;

      const collisions = detectAllCollisions(afterTime.pendulum, afterTime.mechanisms);

      let bounceCollisions: CollisionResult[] = [];
      let gems: string[] = [];
      let triggers: string[] = [];
      let portals: Array<{ id: string; pair: string; pos: Vector2D }> = [];
      let goalHit = false;
      let goalOrigin: Vector2D | null = null;

      for (const col of collisions) {
        const m = col.mechanism as Mechanism;
        switch (m.type) {
          case 'gem':
            if (m.active) gems.push(m.id);
            break;
          case 'trigger':
            if (m.active && !m.triggered) triggers.push(m.id);
            bounceCollisions.push(col);
            break;
          case 'portal': {
            const pm = m as PortalMechanism;
            if (pm.active) portals.push({ id: pm.id, pair: pm.pairedPortalId, pos: pm.position });
            break;
          }
          case 'moving_plank':
            bounceCollisions.push(col);
            break;
          case 'goal':
            if (hasAllTriggersActivated(afterTime.mechanisms)) {
              goalHit = true;
              goalOrigin = m.position;
            }
            bounceCollisions.push(col);
            break;
        }
      }

      for (const gid of gems) st.collectGem(gid);
      for (const tid of triggers) st.triggerMechanism(tid);

      if (portals.length > 0) {
        for (const p of portals) {
          const cd = portalCooldownRef.current;
          const nowM = performance.now();
          if ((cd.get(p.id) || 0) + 600 > nowM) continue;
          const target = afterTime.mechanisms.find((m) => m.id === p.pair);
          if (!target) continue;
          const currentPendulum = store.getState().pendulum;
          const currentAngle = currentPendulum.angle;
          st.teleportPendulum(target.position, currentAngle, true);
          cd.set(p.id, nowM);
          cd.set(p.pair, nowM);
          break;
        }
      }

      const bounceState = store.getState();
      const updated = stepPhysics(bounceState.pendulum, FIXED_STEP / 1000, bounceCollisions);
      st.updatePendulum(updated);

      if (goalHit && goalOrigin && !wonRef.current) {
        wonRef.current = true;
        st.addParticles(goalOrigin, 20);
        setTimeout(() => {
          store.getState().completeLevel();
        }, 250);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (useGameStore.getState().currentView === 'playing') {
      startTimeRef.current = performance.now();
      portalCooldownRef.current = new Map();
      wonRef.current = false;
      accumulatorRef.current = 0;
    }
  }, [useGameStore.getState().currentLevelIndex, useGameStore.getState().currentView]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow:
              '0 0 0 2px #4ECDC4, 0 0 30px rgba(78,205,196,0.35), 0 12px 60px rgba(0,0,0,0.6)',
            background: '#0B0B2B',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', cursor: 'grab' }} />
        </div>
        <ControlButtons />
        <HUD />
      </div>
    </div>
  );
};
