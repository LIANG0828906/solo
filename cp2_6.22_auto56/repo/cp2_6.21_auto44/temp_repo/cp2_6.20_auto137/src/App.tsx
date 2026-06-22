import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  createInitialState,
  isAdjacent,
  canMoveTo,
  getCheetahNextMove,
  collectFruit,
  checkGameOver,
  trySpawnFruits,
  CHEETAH_MOVE_COST,
  ANTELOPE_MOVE_COST,
  MOVE_ANIMATION_DURATION,
  INITIAL_STAMINA,
  GRID_WIDTH,
  GRID_HEIGHT,
} from './game/GameEngine';
import { CanvasRenderer } from './renderer/CanvasRenderer';

interface CircularProgressProps {
  value: number;
  max: number;
  size: number;
  colors: [string, string];
  label: string;
  emoji: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size,
  colors,
  label,
  emoji,
}) => {
  const pct = Math.max(0, Math.min(1, value / max));
  const degrees = pct * 360;
  const innerSize = size - 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
        {emoji} {label}
      </span>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `conic-gradient(${colors[0]} 0deg, ${colors[1]} ${degrees}deg, rgba(255,255,255,0.12) ${degrees}deg, rgba(255,255,255,0.12) 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 12px ${colors[0]}40, inset 0 0 0 1px rgba(255,255,255,0.08)`,
          transition: 'background 0.3s ease',
        }}
      >
        <div
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.ceil(value)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ResultPanelProps {
  winner: 'cheetah' | 'antelope';
  cheetahStamina: number;
  antelopeStamina: number;
  turns: number;
  onRestart: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  winner,
  cheetahStamina,
  antelopeStamina,
  turns,
  onRestart,
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cheetahWin = winner === 'cheetah';
  const winnerText = cheetahWin ? '猎豹胜利！' : '羚羊胜利！';
  const loserText = cheetahWin ? '羚羊体力耗尽或被捕获' : '猎豹体力耗尽';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 20,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 24,
          padding: '40px 56px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          minWidth: 360,
          transform: show ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 4 }}>{cheetahWin ? '🐆' : '🦌'}</div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#fbbf24',
            textShadow: '0 2px 12px rgba(251,191,36,0.4)',
            letterSpacing: 2,
          }}
        >
          {winnerText}
        </div>
        <div style={{ color: '#9ca3af', fontSize: 14, marginTop: -8 }}>{loserText}</div>

        <div
          style={{
            display: 'flex',
            gap: 36,
            marginTop: 12,
            padding: '16px 28px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>🐆</span>
            <span
              style={{
                color: cheetahWin ? '#fbbf24' : '#9ca3af',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {Math.max(0, Math.ceil(cheetahStamina))}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>剩余体力</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>🦌</span>
            <span
              style={{
                color: !cheetahWin ? '#fbbf24' : '#9ca3af',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {Math.max(0, Math.ceil(antelopeStamina))}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>剩余体力</span>
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
          总回合数: <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{turns}</span>
        </div>

        <button
          onClick={onRestart}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.boxShadow =
              '0 6px 20px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow =
              '0 4px 16px rgba(16,185,129,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset';
          }}
          style={{
            marginTop: 8,
            padding: '14px 40px',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow:
              '0 4px 16px rgba(16,185,129,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            letterSpacing: 1,
          }}
        >
          🔄 再来一局
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const animationFrameRef = useRef<number>(0);
  const lastAnimTimestampRef = useRef<number>(0);
  const pendingCheetahMoveRef = useRef<boolean>(false);
  const [, setTick] = useState(0);
  const [resetSpin, setResetSpin] = useState(false);

  const forceUpdate = useCallback(() => setTick((t) => (t + 1) % 1000000), []);

  const startAnimation = useCallback(
    (entity: 'cheetah' | 'antelope', toX: number, toY: number) => {
      const st = stateRef.current;
      const e = entity === 'cheetah' ? st.cheetah : st.antelope;
      st.animation = {
        isAnimating: true,
        fromX: e.x,
        fromY: e.y,
        toX,
        toY,
        progress: 0,
        entity,
      };
      lastAnimTimestampRef.current = 0;
    },
    []
  );

  const completeAnimation = useCallback(() => {
    const st = stateRef.current;
    if (!st.animation) return;
    const e = st.animation.entity === 'cheetah' ? st.cheetah : st.antelope;
    e.x = st.animation.toX;
    e.y = st.animation.toY;
    st.animation = null;
  }, []);

  const finalizeTurn = useCallback(() => {
    const st = stateRef.current;

    const result = collectFruit(st);
    if (result.staminaGained > 0) {
      st.fruits = result.fruits;
      st.antelope.stamina = Math.min(
        st.antelope.maxStamina,
        st.antelope.stamina + result.staminaGained
      );
    }

    const gameOver = checkGameOver(st);
    if (gameOver.isOver) {
      st.isGameOver = true;
      st.winner = gameOver.winner;
      forceUpdate();
      return;
    }

    st.turn += 1;
    st.fruits = trySpawnFruits(st);

    forceUpdate();
  }, [forceUpdate]);

  const runCheetahTurn = useCallback(() => {
    const st = stateRef.current;
    if (st.isGameOver) return;

    const nextMove = getCheetahNextMove(st);
    if (nextMove && st.cheetah.stamina >= CHEETAH_MOVE_COST) {
      startAnimation('cheetah', nextMove.x, nextMove.y);
      st.cheetah.stamina -= CHEETAH_MOVE_COST;
      pendingCheetahMoveRef.current = true;
    } else {
      finalizeTurn();
    }
  }, [startAnimation, finalizeTurn]);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const st = stateRef.current;
      if (st.isGameOver) return;
      if (st.animation && st.animation.isAnimating) return;

      if (!isAdjacent(st.antelope.x, st.antelope.y, x, y)) {
        st.selectedCell = { x, y };
        forceUpdate();
        return;
      }

      if (!canMoveTo(st, x, y)) {
        st.selectedCell = { x, y };
        forceUpdate();
        return;
      }

      if (st.antelope.stamina < ANTELOPE_MOVE_COST) {
        forceUpdate();
        return;
      }

      st.selectedCell = null;
      startAnimation('antelope', x, y);
      st.antelope.stamina -= ANTELOPE_MOVE_COST;
      forceUpdate();
    },
    [forceUpdate, startAnimation]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cell = renderer.getCellAtPixel(px, py);
      if (cell) handleCellClick(cell.x, cell.y);
    },
    [handleCellClick]
  );

  const restartGame = useCallback(() => {
    stateRef.current = createInitialState();
    pendingCheetahMoveRef.current = false;
    lastAnimTimestampRef.current = 0;
    forceUpdate();
  }, [forceUpdate]);

  const handleResetClick = useCallback(() => {
    setResetSpin(true);
    setTimeout(() => setResetSpin(false), 600);
    restartGame();
  }, [restartGame]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new CanvasRenderer(canvasRef.current);
    rendererRef.current = renderer;

    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    const loop = (timestamp: number) => {
      const st = stateRef.current;
      if (st.animation && st.animation.isAnimating) {
        if (lastAnimTimestampRef.current === 0) {
          lastAnimTimestampRef.current = timestamp;
        }
        const elapsed = timestamp - lastAnimTimestampRef.current;
        st.animation.progress = Math.min(1, elapsed / MOVE_ANIMATION_DURATION);

        if (st.animation.progress >= 1) {
          const animEntity = st.animation.entity;
          completeAnimation();

          if (animEntity === 'antelope') {
            const gameOver = checkGameOver(st);
            if (gameOver.isOver) {
              st.isGameOver = true;
              st.winner = gameOver.winner;
              forceUpdate();
            } else {
              pendingCheetahMoveRef.current = false;
              runCheetahTurn();
            }
          } else if (animEntity === 'cheetah' && pendingCheetahMoveRef.current) {
            pendingCheetahMoveRef.current = false;
            finalizeTurn();
          }
        }
      }

      renderer.render(stateRef.current, timestamp);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [completeAnimation, forceUpdate, runCheetahTurn, finalizeTurn]);

  const st = stateRef.current;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f3b0f 0%, #1b5e1b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(126,200,80,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          margin: '16px 20px',
          padding: '14px 28px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            🌿 丛林追逐
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
            点击相邻格子移动羚羊，躲避猎豹追捕
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4px 20px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 12,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>回合</span>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
            {st.turn}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <CircularProgress
            value={st.cheetah.stamina}
            max={INITIAL_STAMINA}
            size={56}
            colors={['#f97316', '#ef4444']}
            label="猎豹"
            emoji="🐆"
          />
          <CircularProgress
            value={st.antelope.stamina}
            max={INITIAL_STAMINA}
            size={56}
            colors={['#22c55e', '#06b6d4']}
            label="羚羊"
            emoji="🦌"
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 20px 80px',
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 900,
            aspectRatio: `${GRID_WIDTH} / ${GRID_HEIGHT}`,
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: 16,
              cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleResetClick}
        style={{
          position: 'absolute',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: resetSpin ? 'rotate(360deg)' : 'rotate(0deg)',
          zIndex: 15,
        }}
        onMouseEnter={(e) => {
          if (!resetSpin) e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
          if (!resetSpin) e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        }}
        title="重新开始"
      >
        🔄
      </button>

      {st.isGameOver && st.winner && (
        <ResultPanel
          winner={st.winner}
          cheetahStamina={st.cheetah.stamina}
          antelopeStamina={st.antelope.stamina}
          turns={st.turn}
          onRestart={restartGame}
        />
      )}
    </div>
  );
};

export default App;
