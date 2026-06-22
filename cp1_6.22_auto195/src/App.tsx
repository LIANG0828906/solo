import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  applyShot,
  resetState,
  cloneBalls,
  GameState,
  TABLE_WIDTH,
  TABLE_HEIGHT,
} from './gameState';
import { updatePhysics, predictPath } from './physics';
import { renderFrame } from './renderer';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(0.03, 0.9));
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [friction, setFriction] = useState(0.03);
  const [restitution, setRestitution] = useState(0.9);
  const [power, setPower] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [replayFrames, setReplayFrames] = useState<number>(0);

  const [, setTick] = useState(0);

  const getCanvasScale = useCallback((canvas: HTMLCanvasElement) => {
    const padding = 60;
    const availW = canvas.width - padding * 2;
    const availH = canvas.height - padding * 2;
    const scale = Math.min(availW / TABLE_WIDTH, availH / TABLE_HEIGHT);
    const offsetX = (canvas.width - TABLE_WIDTH * scale) / 2;
    const offsetY = (canvas.height - TABLE_HEIGHT * scale) / 2;
    return { scale, offsetX, offsetY };
  }, []);

  const canvasToTable = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, offsetY } = getCanvasScale(canvas);
      const x = (clientX - rect.left - offsetX) / scale;
      const y = (clientY - rect.top - offsetY) / scale;
      return { x, y };
    },
    [getCanvasScale]
  );

  useEffect(() => {
    stateRef.current.friction = friction;
    stateRef.current.restitution = restitution;
  }, [friction, restitution]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const state = stateRef.current;
      const { scale, offsetX, offsetY } = getCanvasScale(canvas);

      if (!state.isReplaying && state.isMoving) {
        const deltaTime = Math.min(2, (timestamp - lastTimeRef.current) / 16.67 || 1);
        const subSteps = 3;
        const dt = deltaTime / subSteps;

        for (let i = 0; i < subSteps; i++) {
          const result = updatePhysics(
            state.balls,
            state.friction,
            state.restitution,
            state.tableWidth,
            state.tableHeight,
            state.cushionWidth,
            dt
          );
          state.balls = result.balls;
          state.collisionEffects = [
            ...state.collisionEffects
              .map(e => ({ ...e, alpha: e.alpha - 0.06 }))
              .filter(e => e.alpha > 0),
            ...result.collisionEffects,
          ];

          if (!result.anyMoving && i === subSteps - 1) {
            state.isMoving = false;
            setIsMoving(false);
            setReplayFrames(state.replayFrames.length);
          }
        }

        state.replayFrames.push(cloneBalls(state.balls));
        if (state.replayFrames.length > 3000) {
          state.replayFrames.shift();
        }
      } else if (state.isReplaying) {
        if (state.replayIndex >= 0 && state.replayIndex < state.replayFrames.length) {
          const frame = state.replayFrames[state.replayIndex];
          state.balls = cloneBalls(frame);
        }
      }

      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGrad.addColorStop(0, '#4E342E');
      bgGrad.addColorStop(0.5, '#3E2723');
      bgGrad.addColorStop(1, '#2C1810');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let predictPoints: { x: number; y: number }[] = [];
      if (state.isAiming) {
        const cueBall = state.balls.find(b => b.isCueBall && !b.isPocketed);
        if (cueBall && state.power > 0) {
          predictPoints = predictPath(
            cueBall,
            state.balls,
            state.aimAngle,
            state.power,
            state.friction,
            state.restitution,
            state.tableWidth,
            state.tableHeight,
            state.cushionWidth
          );
        }
      }

      renderFrame(
        ctx,
        state.balls,
        state.tableWidth,
        state.tableHeight,
        state.cushionWidth,
        state.isAiming,
        state.aimAngle,
        state.power,
        predictPoints,
        state.collisionEffects,
        offsetX,
        offsetY,
        scale
      );

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [getCanvasScale]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      setTick(t => t + 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = stateRef.current;
      if (state.isMoving || state.isReplaying) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const { x, y } = canvasToTable(e.clientX, e.clientY, canvas);
      const cueBall = state.balls.find(b => b.isCueBall && !b.isPocketed);
      if (!cueBall) return;

      const dx = x - cueBall.x;
      const dy = y - cueBall.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < cueBall.radius * 4) {
        state.isAiming = true;
        state.aimAngle = Math.atan2(dy, dx);
        state.power = 0;
        setPower(0);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [canvasToTable]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const state = stateRef.current;
      mouseRef.current = { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (!canvas) return;

      const { x, y } = canvasToTable(e.clientX, e.clientY, canvas);

      if (state.isAiming && dragStartRef.current) {
        const cueBall = state.balls.find(b => b.isCueBall && !b.isPocketed);
        if (cueBall) {
          const dx = cueBall.x - x;
          const dy = cueBall.y - y;
          state.aimAngle = Math.atan2(dy, dx);

          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxPower = 200;
          const newPower = Math.min(100, Math.max(0, (dist / maxPower) * 100));
          state.power = newPower;
          setPower(newPower);
        }
      }
    },
    [canvasToTable]
  );

  const handleMouseUp = useCallback(() => {
    const state = stateRef.current;
    if (!state.isAiming) return;

    if (state.power > 2) {
      const newState = applyShot(state, state.aimAngle, state.power);
      stateRef.current = newState;
      setIsMoving(true);
      setPower(0);
      setReplayFrames(0);
      setReplayIndex(-1);
      setIsReplaying(false);
    } else {
      state.isAiming = false;
      state.power = 0;
      setPower(0);
    }
    dragStartRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    stateRef.current = resetState(stateRef.current);
    stateRef.current.friction = friction;
    stateRef.current.restitution = restitution;
    setIsMoving(false);
    setPower(0);
    setIsReplaying(false);
    setReplayIndex(-1);
    setReplayFrames(0);
  }, [friction, restitution]);

  const handleReplayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const state = stateRef.current;
    const idx = parseInt(e.target.value, 10);
    if (idx < 0 || idx >= state.replayFrames.length) return;

    state.isReplaying = true;
    state.replayIndex = idx;
    setIsReplaying(true);
    setReplayIndex(idx);
  }, []);

  const handleReplayEnd = useCallback(() => {
    const state = stateRef.current;
    if (state.replayFrames.length > 0) {
      const lastFrame = state.replayFrames[state.replayFrames.length - 1];
      state.balls = cloneBalls(lastFrame);
    }
    state.isReplaying = false;
    state.replayIndex = -1;
    setIsReplaying(false);
    setReplayIndex(-1);
  }, []);

  const powerPercent = Math.round(power);

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={styles.panelTitle}>台球物理模拟器</div>

        <div style={styles.section}>
          <div style={styles.label}>
            摩擦系数: {friction.toFixed(3)}
          </div>
          <input
            type="range"
            min="0.01"
            max="0.1"
            step="0.005"
            value={friction}
            onChange={e => setFriction(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.hint}>数值越小，球滑行越远</div>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>
            弹性系数: {restitution.toFixed(2)}
          </div>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={restitution}
            onChange={e => setRestitution(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.hint}>数值越大，反弹越强</div>
        </div>

        <div style={styles.section}>
          <div style={styles.label}>力度: {powerPercent}%</div>
          <div style={styles.powerBarContainer}>
            <div
              style={{
                ...styles.powerBarFill,
                width: `${powerPercent}%`,
                background: powerPercent > 70
                  ? 'linear-gradient(90deg, #4CAF50, #FFC107, #F44336)'
                  : powerPercent > 40
                  ? 'linear-gradient(90deg, #4CAF50, #FFC107)'
                  : 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              }}
            />
          </div>
        </div>

        <button style={styles.button} onClick={handleReset}>
          重置球局
        </button>

        {replayFrames > 0 && (
          <div style={styles.section}>
            <div style={styles.label}>
              回放: {replayIndex >= 0 ? `第 ${replayIndex + 1} 帧` : '拖动滑块回放'}
            </div>
            <input
              type="range"
              min="0"
              max={replayFrames - 1}
              value={replayIndex >= 0 ? replayIndex : 0}
              onChange={handleReplayChange}
              onMouseUp={handleReplayEnd}
              onTouchEnd={handleReplayEnd}
              style={styles.slider}
            />
          </div>
        )}

        <div style={styles.tip}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>操作说明</div>
          <div>• 在母球附近按住鼠标拖拽瞄准</div>
          <div>• 拖拽距离决定击球力度</div>
          <div>• 释放鼠标击球</div>
          <div>• 击球后可拖动时间轴回放</div>
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {(isMoving || isReplaying) && (
          <div style={styles.statusBadge}>
            {isReplaying ? '回放中' : '球运动中...'}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #4E342E 0%, #3E2723 50%, #2C1810 100%)',
  },
  panel: {
    width: 260,
    padding: '20px 18px',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    borderRadius: 0,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FFF8E1',
    textAlign: 'center',
    padding: '6px 0 10px',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    letterSpacing: 1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#FFECB3',
    fontWeight: 500,
  },
  slider: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.15)',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
  },
  hint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  powerBarContainer: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    background: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 7,
    transition: 'width 0.05s linear',
  },
  button: {
    marginTop: 4,
    padding: '11px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #D32F2F, #B71C1C)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
  },
  tip: {
    marginTop: 'auto',
    padding: 12,
    borderRadius: 10,
    background: 'rgba(0,0,0,0.25)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 1.6,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 24,
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(0,0,0,0.6)',
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: 500,
    backdropFilter: 'blur(8px)',
  },
};

export default App;
