import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from './GameState';
import { Renderer } from './Renderer';
import { updateBalls, allBallsStopped } from './PhysicsEngine';
import { checkCollisions, checkPockets } from './CollisionDetector';
import {
  Ball,
  TableDimensions,
  Pocket,
  BALL_COLORS,
  TABLE_WIDTH,
  TABLE_HEIGHT,
  BALL_RADIUS,
  POCKET_RADIUS,
  CUSHION_WIDTH,
  MAX_SHOT_SPEED,
  SnapshotBall,
  CushionFlash,
  FOUL_FLASH_DURATION,
} from './types';

function createTable(): TableDimensions {
  const playW = TABLE_WIDTH;
  const playH = TABLE_HEIGHT;

  const pockets: Pocket[] = [
    { x: CUSHION_WIDTH, y: CUSHION_WIDTH, radius: POCKET_RADIUS },
    {
      x: CUSHION_WIDTH + playW / 2,
      y: CUSHION_WIDTH,
      radius: POCKET_RADIUS,
    },
    {
      x: CUSHION_WIDTH + playW,
      y: CUSHION_WIDTH,
      radius: POCKET_RADIUS,
    },
    {
      x: CUSHION_WIDTH,
      y: CUSHION_WIDTH + playH,
      radius: POCKET_RADIUS,
    },
    {
      x: CUSHION_WIDTH + playW / 2,
      y: CUSHION_WIDTH + playH,
      radius: POCKET_RADIUS,
    },
    {
      x: CUSHION_WIDTH + playW,
      y: CUSHION_WIDTH + playH,
      radius: POCKET_RADIUS,
    },
  ];

  return {
    x: 0,
    y: 0,
    width: playW + 2 * CUSHION_WIDTH,
    height: playH + 2 * CUSHION_WIDTH,
    cushionWidth: CUSHION_WIDTH,
    pockets,
  };
}

function createBall(id: number, x: number, y: number): Ball {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: BALL_COLORS[id],
    stripe: id >= 9,
    number: id,
    pocketed: false,
  };
}

function createBallsSequential(): Ball[] {
  const balls: Ball[] = [];
  balls.push(
    createBall(
      0,
      CUSHION_WIDTH + TABLE_WIDTH * 0.25,
      CUSHION_WIDTH + TABLE_HEIGHT / 2
    )
  );

  const startX = CUSHION_WIDTH + TABLE_WIDTH * 0.72;
  const startY = CUSHION_WIDTH + TABLE_HEIGHT / 2;
  const spacing = BALL_RADIUS * 2 + 1;
  const rowDx = spacing * Math.sqrt(3) / 2;

  const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + row * rowDx;
      const y = startY + (col - row / 2) * spacing;
      balls.push(createBall(order[idx], x, y));
      idx++;
    }
  }

  return balls;
}

function createBallsFree(): Ball[] {
  const balls: Ball[] = [];
  balls.push(
    createBall(
      0,
      CUSHION_WIDTH + TABLE_WIDTH * 0.25,
      CUSHION_WIDTH + TABLE_HEIGHT / 2
    )
  );

  const startX = CUSHION_WIDTH + TABLE_WIDTH * 0.6;
  const startY = CUSHION_WIDTH + TABLE_HEIGHT * 0.5;
  const spacing = BALL_RADIUS * 2 + 3;

  let row = 0;
  let col = 0;
  let rowMax = 0;
  for (let i = 1; i <= 15; i++) {
    const x = startX + row * spacing * Math.sqrt(3) / 2;
    const y = startY + (col - row / 2) * spacing;
    balls.push(createBall(i, x, y));
    col++;
    if (col > rowMax) {
      row++;
      col = 0;
      rowMax++;
    }
  }

  return balls;
}

function placeCueBall(balls: Ball[]) {
  const cue = balls.find((b) => b.id === 0);
  if (!cue) return;
  cue.pocketed = false;
  cue.vx = 0;
  cue.vy = 0;
  cue.x = CUSHION_WIDTH + TABLE_WIDTH * 0.25;
  cue.y = CUSHION_WIDTH + TABLE_HEIGHT / 2;
  let tries = 0;
  while (tries < 200) {
    let overlap = false;
    for (const b of balls) {
      if (b.id === 0 || b.pocketed) continue;
      const dx = cue.x - b.x;
      const dy = cue.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < cue.radius + b.radius + 2) {
        overlap = true;
        break;
      }
    }
    if (!overlap) break;
    cue.x += 5;
    tries++;
  }
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const tableRef = useRef<TableDimensions>(createTable());
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    type: 'cue' | 'target' | 'none';
    ballId: number;
    offsetX: number;
    offsetY: number;
  }>({ type: 'none', ballId: -1, offsetX: 0, offsetY: 0 });
  const aimDirRef = useRef({ x: 1, y: 0 });
  const powerStartRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const canvasSizeRef = useRef({ w: 800, h: 600 });
  const isMobileRef = useRef(false);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  const mode = useGameStore((s) => s.mode);
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const pocketedBallIds = useGameStore((s) => s.pocketedBallIds);
  const currentTarget = useGameStore((s) => s.currentTarget);
  const foul = useGameStore((s) => s.foul);
  const foulTime = useGameStore((s) => s.foulTime);
  const shotHistory = useGameStore((s) => s.shotHistory);
  const isReplaying = useGameStore((s) => s.isReplaying);
  const replayFrameIndex = useGameStore((s) => s.replayFrameIndex);
  const power = useGameStore((s) => s.power);

  const computeTransform = useCallback((cw: number, ch: number) => {
    const table = tableRef.current;
    const pct = isMobileRef.current ? 0.9 : 0.65;
    const scaleX = (cw * pct) / table.width;
    const scaleY = (ch * pct) / table.height;
    const s = Math.min(scaleX, scaleY);
    const ox = (cw - table.width * s) / 2;
    const oy = (ch - table.height * s) / 2;
    scaleRef.current = s;
    offsetRef.current = { x: ox, y: oy };
  }, []);

  const screenToGame = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - offsetRef.current.x) / scaleRef.current,
      y: (sy - offsetRef.current.y) / scaleRef.current,
    };
  }, []);

  useEffect(() => {
    ballsRef.current =
      mode === 'sequential' ? createBallsSequential() : createBallsFree();
  }, [mode]);

  useEffect(() => {
    const check = () => {
      isMobileRef.current = window.innerWidth < 768;
      const canvas = canvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          canvasSizeRef.current = { w: rect.width, h: rect.height };
          computeTransform(rect.width, rect.height);
        }
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [computeTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvasSizeRef.current = { w, h };
      computeTransform(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [computeTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    rendererRef.current = new Renderer(ctx);
  }, []);

  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cw = canvasSizeRef.current.w;
      const ch = canvasSizeRef.current.h;
      computeTransform(cw, ch);
      renderer.setTransform(scaleRef.current, offsetRef.current.x, offsetRef.current.y);
      renderer.clear(cw, ch);

      const table = tableRef.current;
      const state = useGameStore.getState();

      if (state.phase === 'moving') {
        updateBalls(ballsRef.current, table, (flash: CushionFlash) => {
          useGameStore.getState().addCushionFlash(flash);
        });

        for (let iter = 0; iter < 2; iter++) {
          checkCollisions(ballsRef.current);
        }
        const pocketed = checkPockets(ballsRef.current, table.pockets);

        const latestState = useGameStore.getState();

        for (const id of pocketed) {
          latestState.addPocketedBall(id);
          if (latestState.mode === 'sequential' && id !== 0) {
            if (id === latestState.currentTarget) {
              useGameStore.setState({ score: latestState.score + 10 });
              useGameStore.setState({ currentTarget: latestState.currentTarget + 1 });
            } else {
              latestState.triggerFoul();
            }
          } else if (latestState.mode === 'free' && id !== 0) {
            useGameStore.setState({ score: latestState.score + 10 });
          }
          if (id === 0) {
            placeCueBall(ballsRef.current);
          }
        }

        const frameBalls: SnapshotBall[] = ballsRef.current.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
        }));
        useGameStore.getState().addFrameToShot({ balls: frameBalls });

        if (allBallsStopped(ballsRef.current)) {
          useGameStore.getState().endShot();
          useGameStore.getState().setPhase('idle');
        }
      }

      if (state.isReplaying) {
        const lastShot = state.shotHistory[state.shotHistory.length - 1];
        if (lastShot && state.replayFrameIndex < lastShot.frames.length) {
          useGameStore.getState().advanceReplay();
          const currentState = useGameStore.getState();
          const idx = Math.min(currentState.replayFrameIndex, lastShot.frames.length - 1);
          const frame = lastShot.frames[idx];

          renderer.drawTable(table);
          renderer.drawPockets(table);

          if (lastShot.trajectories.length > 0) {
            renderer.drawTrajectories(lastShot.trajectories);
          }

          renderer.drawReplayBalls(frame.balls, BALL_COLORS);
        } else {
          useGameStore.getState().endReplay();
        }
      } else {
        renderer.drawTable(table);
        renderer.drawPockets(table);

        const currentFlashes = useGameStore.getState().cushionFlashes;
        renderer.drawCushionFlash(currentFlashes, table);

        for (const ball of ballsRef.current) {
          renderer.drawBall(ball);
        }

        const cueBall = ballsRef.current.find((b) => b.id === 0);
        const currentPhase = useGameStore.getState().phase;
        if (cueBall && !cueBall.pocketed && currentPhase === 'idle') {
          renderer.drawAimLine(cueBall, mouseRef.current.x, mouseRef.current.y, true);
        }

        const currentPower = useGameStore.getState().power;
        renderer.drawPowerBar(currentPower, cw, ch, currentPhase === 'power');
      }

      const currentFoul = useGameStore.getState().foul;
      const currentFoulTime = useGameStore.getState().foulTime;
      useGameStore.getState().clearFoul();
      if (currentFoul && Date.now() - currentFoulTime < FOUL_FLASH_DURATION) {
        const elapsed = Date.now() - currentFoulTime;
        const progress = elapsed / FOUL_FLASH_DURATION;
        const intensity = Math.abs(Math.sin(elapsed / 150)) * (1 - progress * 0.5);
        renderer.drawFoul(cw, ch, true, intensity);
      }

      useGameStore.getState().cleanCushionFlashes();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [computeTransform]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = useGameStore.getState();
      if (state.phase === 'moving' || state.isReplaying) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const gp = screenToGame(sx, sy);

      for (const ball of ballsRef.current) {
        if (ball.pocketed) continue;
        const dx = gp.x - ball.x;
        const dy = gp.y - ball.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.radius + 4) {
          if (ball.id === 0) {
            dragRef.current = { type: 'cue', ballId: 0, offsetX: dx, offsetY: dy };
            useGameStore.getState().setPhase('idle');
            return;
          } else if (state.mode === 'free') {
            dragRef.current = { type: 'target', ballId: ball.id, offsetX: dx, offsetY: dy };
            return;
          }
        }
      }

      const cueBall = ballsRef.current.find((b) => b.id === 0);
      if (cueBall && !cueBall.pocketed) {
        const dx = gp.x - cueBall.x;
        const dy = gp.y - cueBall.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001) {
          aimDirRef.current = { x: dx / dist, y: dy / dist };
        }
      }

      powerStartRef.current = { x: sx, y: sy };
      useGameStore.getState().setPhase('power');
      useGameStore.getState().setPower(0);
    },
    [screenToGame]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const gp = screenToGame(sx, sy);

      mouseRef.current = { x: gp.x, y: gp.y };

      if (dragRef.current.type !== 'none') {
        const ball = ballsRef.current.find((b) => b.id === dragRef.current.ballId);
        if (ball) {
          const table = tableRef.current;
          const left = table.x + table.cushionWidth + ball.radius;
          const right = table.x + table.width - table.cushionWidth - ball.radius;
          const top = table.y + table.cushionWidth + ball.radius;
          const bottom = table.y + table.height - table.cushionWidth - ball.radius;
          ball.x = Math.max(left, Math.min(right, gp.x - dragRef.current.offsetX));
          ball.y = Math.max(top, Math.min(bottom, gp.y - dragRef.current.offsetY));
        }
        return;
      }

      const state = useGameStore.getState();
      if (state.phase === 'power') {
        const dx = sx - powerStartRef.current.x;
        const dy = sy - powerStartRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const p = Math.min(100, (dist / 250) * 100);
        state.setPower(p);

        const cueBall = ballsRef.current.find((b) => b.id === 0);
        if (cueBall) {
          const ddx = gp.x - cueBall.x;
          const ddy = gp.y - cueBall.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd > 0.001) {
            aimDirRef.current = { x: ddx / dd, y: ddy / dd };
          }
        }
      } else if (state.phase === 'idle') {
        const cueBall = ballsRef.current.find((b) => b.id === 0);
        if (cueBall && !cueBall.pocketed) {
          const dx = gp.x - cueBall.x;
          const dy = gp.y - cueBall.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.001) {
            aimDirRef.current = { x: dx / dist, y: dy / dist };
          }
        }
      }
    },
    [screenToGame]
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.type !== 'none') {
      dragRef.current = { type: 'none', ballId: -1, offsetX: 0, offsetY: 0 };
      useGameStore.getState().setPhase('idle');
      return;
    }

    const state = useGameStore.getState();
    if (state.phase === 'power' && state.power > 0) {
      const cueBall = ballsRef.current.find((b) => b.id === 0);
      if (cueBall && !cueBall.pocketed) {
        const speed = (state.power / 100) * MAX_SHOT_SPEED;
        cueBall.vx = aimDirRef.current.x * speed;
        cueBall.vy = aimDirRef.current.y * speed;
        state.startShot();
        state.setPhase('moving');
      }
      state.setPower(0);
    } else if (state.phase === 'power') {
      state.setPower(0);
      state.setPhase('idle');
    }
  }, []);

  const handleModeSwitch = useCallback((newMode: 'free' | 'sequential') => {
    const state = useGameStore.getState();
    state.setMode(newMode);
    state.resetGame();
    ballsRef.current =
      newMode === 'sequential' ? createBallsSequential() : createBallsFree();
    state.setPhase('idle');
    forceUpdate((n) => n + 1);
  }, []);

  const handleReplay = useCallback(() => {
    const state = useGameStore.getState();
    if (state.shotHistory.length === 0) return;
    state.startReplay();
    forceUpdate((n) => n + 1);
  }, []);

  const handleReset = useCallback(() => {
    const state = useGameStore.getState();
    state.resetGame();
    ballsRef.current =
      state.mode === 'sequential' ? createBallsSequential() : createBallsFree();
    state.setPhase('idle');
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          gap: 24,
          borderBottom: '1px solid #2a2a4e',
          flexShrink: 0,
        }}
      >
        <span>得分: {score}</span>
        <span>|</span>
        <span>进球: {pocketedBallIds.filter((id) => id !== 0).length}</span>
        {mode === 'sequential' && (
          <>
            <span>|</span>
            <span>目标: {currentTarget <= 15 ? currentTarget + '号' : '完成!'}</span>
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            padding: 12,
            gap: 8,
            borderRight: '1px solid #2a2a4e',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => handleModeSwitch('free')}
            style={{
              padding: '10px 8px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
              background: mode === 'free' ? '#0f3460' : '#16213e',
              transition: 'background 0.3s',
            }}
          >
            自由练习
          </button>
          <button
            onClick={() => handleModeSwitch('sequential')}
            style={{
              padding: '10px 8px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
              background: mode === 'sequential' ? '#0f3460' : '#16213e',
              transition: 'background 0.3s',
            }}
          >
            顺序击球
          </button>

          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              fontSize: 11,
            }}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => {
              const isPocketed = pocketedBallIds.includes(num);
              const isTarget = mode === 'sequential' && num === currentTarget;
              return (
                <div
                  key={num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: isPocketed ? '#666' : isTarget ? '#FFD700' : '#fff',
                    fontWeight: isPocketed ? 'normal' : 'bold',
                    textDecoration: isPocketed ? 'line-through' : 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: BALL_COLORS[num],
                      border: isTarget ? '1px solid #FFD700' : '1px solid #555',
                    }}
                  />
                  {num}号
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: phase === 'power' ? 'crosshair' : 'default',
              display: 'block',
            }}
          />
        </div>

        <div
          style={{
            width: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderLeft: '1px solid #2a2a4e',
            flexShrink: 0,
            padding: 12,
          }}
        >
          <button
            onClick={handleReplay}
            disabled={shotHistory.length === 0 || isReplaying}
            style={{
              padding: '8px 6px',
              border: 'none',
              borderRadius: 6,
              cursor:
                shotHistory.length === 0 || isReplaying ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              color: '#fff',
              background:
                shotHistory.length === 0 || isReplaying ? '#333' : '#0f3460',
              width: '100%',
              transition: 'background 0.3s',
            }}
          >
            回放
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 6px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
              color: '#fff',
              background: '#5c3a21',
              width: '100%',
            }}
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
