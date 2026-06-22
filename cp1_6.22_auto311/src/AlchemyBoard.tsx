import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import type { GameState, Material, AlchemySlot } from './types';
import { findAdjacentFilledPairs, SLOT_SIZE, SLOT_RADIUS, BOARD_SIZE } from './utils/geometryUtils';

interface AlchemyBoardProps {
  state: GameState;
  onPlaceMaterial: (slotIndex: number, materialId: string) => void;
  onRemoveMaterial: (slotIndex: number) => void;
  onTriggerSynthesis: (slotA: number, slotB: number) => void;
  onClearAllSlots: () => void;
  onSynthesisMessageTimeout: () => void;
}

interface LightPointState {
  active: boolean;
  phase: 'idle' | 'grow' | 'fade';
  progress: number;
}

const AlchemyBoardComponent: React.FC<AlchemyBoardProps> = ({
  state,
  onPlaceMaterial,
  onRemoveMaterial,
  onTriggerSynthesis,
  onClearAllSlots,
  onSynthesisMessageTimeout,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [lightPoint, setLightPoint] = useState<LightPointState>({
    active: false,
    phase: 'idle',
    progress: 0,
  });
  const [shrinkingSlots, setShrinkingSlots] = useState<Set<number>>(new Set());

  const adjacentPairs = useMemo(() => findAdjacentFilledPairs(state.slots), [state.slots]);

  useEffect(() => {
    if (state.isAnimating) {
      const pairs = findAdjacentFilledPairs(state.slots);
      if (pairs.length > 0) {
        const [a, b] = pairs[0];
        setShrinkingSlots(new Set([a, b]));

        setTimeout(() => {
          setLightPoint({ active: true, phase: 'grow', progress: 0 });
          const startTime = performance.now();
          const GROW_DURATION = 300;

          const animate = (now: number) => {
            const elapsed = now - startTime;
            if (elapsed < GROW_DURATION) {
              setLightPoint({
                active: true,
                phase: 'grow',
                progress: elapsed / GROW_DURATION,
              });
              rafRef.current = requestAnimationFrame(animate);
            } else {
              setLightPoint({ active: true, phase: 'fade', progress: 1 });
              const fadeStart = performance.now();
              const FADE_DURATION = 200;
              const fadeAnimate = (now2: number) => {
                const elapsed2 = now2 - fadeStart;
                if (elapsed2 < FADE_DURATION) {
                  setLightPoint({
                    active: true,
                    phase: 'fade',
                    progress: 1 - elapsed2 / FADE_DURATION,
                  });
                  rafRef.current = requestAnimationFrame(fadeAnimate);
                } else {
                  setLightPoint({ active: false, phase: 'idle', progress: 0 });
                  setShrinkingSlots(new Set());
                }
              };
              rafRef.current = requestAnimationFrame(fadeAnimate);
            }
          };
          rafRef.current = requestAnimationFrame(animate);
        }, 200);
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state.isAnimating, state.slots]);

  useEffect(() => {
    if (state.synthesisMessage) {
      const t = setTimeout(() => {
        onSynthesisMessageTimeout();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [state.synthesisMessage, onSynthesisMessageTimeout]);

  const handleDrop = useCallback(
    (slotIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlot(null);
      const materialId = e.dataTransfer.getData('application/x-material-id');
      if (materialId) {
        onPlaceMaterial(slotIndex, materialId);
      }
    },
    [onPlaceMaterial]
  );

  const handleDragOver = useCallback((slotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleSlotClick = useCallback(
    (slot: AlchemySlot) => {
      if (state.isAnimating) return;
      if (slot.materialId) {
        const pair = adjacentPairs.find(
          ([a, b]) => a === slot.index || b === slot.index
        );
        if (pair) {
          onTriggerSynthesis(pair[0], pair[1]);
        }
      }
    },
    [state.isAnimating, adjacentPairs, onTriggerSynthesis]
  );

  const renderSlot = (slot: AlchemySlot) => {
    const mat = slot.materialId ? state.materials[slot.materialId] : null;
    const isShrinking = shrinkingSlots.has(slot.index);
    const isDragTarget = dragOverSlot === slot.index && !slot.materialId;

    const slotStyle: React.CSSProperties = {
      position: 'absolute',
      left: slot.position.x - SLOT_RADIUS,
      top: slot.position.y - SLOT_RADIUS,
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      borderRadius: '50%',
      background: slot.materialId ? 'rgba(61,43,26,0.9)' : 'rgba(61,43,26,0.5)',
      border: `2px solid ${slot.isGlowing ? '#ffd54f' : '#8b7355'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: slot.materialId ? 'pointer' : 'default',
      transition: 'transform 0.3s ease-out, box-shadow 0.3s, border-color 0.3s',
      transform: isShrinking ? 'scale(0)' : isDragTarget ? 'scale(1.1)' : 'scale(1)',
      animation: slot.isGlowing && !isShrinking ? 'slotGlow 0.5s infinite alternate' : undefined,
      zIndex: isDragTarget ? 5 : 2,
      boxShadow: isDragTarget
        ? '0 0 20px rgba(255, 213, 79, 0.6)'
        : slot.isGlowing
        ? '0 0 16px rgba(255, 213, 79, 0.4), inset 0 0 12px rgba(255, 179, 0, 0.3)'
        : 'inset 0 2px 6px rgba(0,0,0,0.4)',
    };

    return (
      <div
        key={slot.index}
        style={slotStyle}
        onClick={() => handleSlotClick(slot)}
        onDoubleClick={() => slot.materialId && onRemoveMaterial(slot.index)}
        onDragOver={(e) => handleDragOver(slot.index, e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(slot.index, e)}
        title={
          mat
            ? `${mat.name} · ${slot.isGlowing ? '点击相邻槽位触发合成' : '双击移回仓库'}`
            : '拖入材料'
        }
      >
        {mat && <span style={{ fontSize: 30, lineHeight: 1 }}>{mat.emoji}</span>}
      </div>
    );
  };

  const centerX = BOARD_SIZE / 2;
  const centerY = BOARD_SIZE / 2;

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <div style={styles.statusLeft}>
          <h1 style={styles.title}>⚗️ Alchemy Lab</h1>
          <span style={styles.statusHint}>
            将材料拖入炼金台 · 两个相邻材料即可合成 · 双击槽位移除材料
          </span>
        </div>
        <div style={styles.statusRight}>
          {state.hasPassionBuff && (
            <div style={styles.passionBadge} title="炼金热情：失效率降至10%">
              <span style={{ ...styles.passionEmoji, animation: 'passionPulse 1s infinite' }}>
                🔥
              </span>
              <span style={styles.passionLabel}>炼金热情</span>
            </div>
          )}
          <div style={styles.failureRateBadge}>
            <span style={styles.failureLabel}>失效率</span>
            <span
              style={{
                ...styles.failureValue,
                color: state.failureRate > 0.15 ? '#e74c3c' : '#ffd54f',
              }}
            >
              {(state.failureRate * 100).toFixed(0)}%
            </span>
          </div>
          <button style={styles.clearBtn} onClick={onClearAllSlots} title="清空所有槽位">
            清空
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        style={{
          ...styles.board,
          animation: state.showBoardBreath ? 'boardBreath 0.5s infinite' : undefined,
        }}
      >
        <div style={styles.boardInnerDecor} />

        <svg
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {adjacentPairs.map(([a, b], i) => {
            const sA = state.slots[a];
            const sB = state.slots[b];
            return (
              <line
                key={`line-${i}`}
                x1={sA.position.x}
                y1={sA.position.y}
                x2={sB.position.x}
                y2={sB.position.y}
                stroke="url(#glowGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={state.isAnimating ? 0 : 0.9}
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 213, 79, 0.6))',
                  animation: 'pulseLine 1s infinite',
                }}
              />
            );
          })}
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="100%" stopColor="#ffb300" />
            </linearGradient>
            <radialGradient id="centerSpark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="1" />
              <stop offset="40%" stopColor="#ffd54f" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffb300" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {lightPoint.active && (
          <div
            style={{
              position: 'absolute',
              left: centerX,
              top: centerY,
              width: 40 * (lightPoint.phase === 'grow' ? lightPoint.progress : Math.max(lightPoint.progress, 0)),
              height: 40 * (lightPoint.phase === 'grow' ? lightPoint.progress : Math.max(lightPoint.progress, 0)),
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, #ffd54f 40%, transparent 80%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: `0 0 ${30 * lightPoint.progress}px rgba(255, 213, 79, ${0.8 * lightPoint.progress})`,
              opacity: lightPoint.phase === 'fade' ? lightPoint.progress : 1,
            }}
          />
        )}

        <div style={styles.centerRune}>✦</div>

        {state.slots.map(renderSlot)}

        {state.synthesisMessage && (
          <div
            style={{
              ...styles.synthesisMessage,
              animation:
                state.synthesisMessage.type === 'failure'
                  ? 'shakeMsg 0.3s ease-out'
                  : 'fadeInUp 0.4s ease-out',
              color: state.synthesisMessage.type === 'success' ? '#ffd54f' : '#e74c3c',
              borderColor:
                state.synthesisMessage.type === 'success' ? '#ffd54f55' : '#e74c3c55',
              background:
                state.synthesisMessage.type === 'success'
                  ? 'rgba(255, 213, 79, 0.1)'
                  : 'rgba(231, 76, 60, 0.1)',
            }}
          >
            {state.synthesisMessage.text}
          </div>
        )}
      </div>

      {adjacentPairs.length > 0 && (
        <div style={styles.synthesisHint}>
          ✨ 发现 {adjacentPairs.length} 组合成路径，点击发光的槽位开始炼金
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties | string> = {
  wrapper: {
    flex: 1,
    minWidth: 500,
    background: 'linear-gradient(180deg, #0f0f1e 0%, #0a0a18 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  statusLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: 24,
    fontWeight: 700,
    color: '#ffd54f',
    margin: 0,
    letterSpacing: 2,
    textShadow: '0 0 20px rgba(255, 213, 79, 0.4)',
  },
  statusHint: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#7a7aaa',
  },
  statusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  passionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(231, 76, 60, 0.15)',
    border: '1px solid #e74c3c55',
    borderRadius: 20,
    padding: '4px 10px',
  },
  passionEmoji: {
    fontSize: 16,
    display: 'inline-block',
    transformOrigin: 'center',
  },
  passionLabel: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#ff9980',
    fontWeight: 600,
  },
  failureRateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#1e1e3e',
    border: '1px solid #3a3a5a',
    borderRadius: 20,
    padding: '4px 12px',
  },
  failureLabel: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#7a7aaa',
  },
  failureValue: {
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    fontWeight: 700,
  },
  clearBtn: {
    background: 'transparent',
    border: '1px solid #4a4a6a',
    color: '#b8b8d0',
    fontFamily: "'Crimson Text', serif",
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'transform 0.3s ease-out, border-color 0.3s, color 0.3s',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 50% 50%, #3d2b1a 0%, #2c1810 60%, #1e1008 100%)',
    border: '4px solid #c9a961',
    position: 'relative',
    boxShadow:
      '0 0 40px rgba(201, 169, 97, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.6), 0 20px 60px rgba(0,0,0,0.6)',
    transformOrigin: 'center center',
  },
  boardInnerDecor: {
    position: 'absolute',
    left: 30,
    top: 30,
    right: 30,
    bottom: 30,
    borderRadius: '50%',
    border: '1px dashed rgba(201, 169, 97, 0.25)',
    pointerEvents: 'none',
  },
  centerRune: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 28,
    color: '#c9a961',
    opacity: 0.4,
    fontFamily: 'serif',
    textShadow: '0 0 10px rgba(201, 169, 97, 0.4)',
    zIndex: 0,
  },
  synthesisMessage: {
    position: 'absolute',
    left: '50%',
    bottom: -10,
    transform: 'translate(-50%, 100%)',
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 700,
    padding: '8px 18px',
    borderRadius: 20,
    border: '1px solid',
    whiteSpace: 'nowrap',
    zIndex: 20,
  },
  synthesisHint: {
    marginTop: 24,
    fontFamily: "'Crimson Text', serif",
    fontSize: 13,
    color: '#ffd54f',
    padding: '8px 16px',
    background: 'rgba(255, 213, 79, 0.08)',
    border: '1px solid rgba(255, 213, 79, 0.2)',
    borderRadius: 20,
    animation: 'fadeInUp 0.4s ease-out',
  },
};

export const AlchemyBoard = memo(AlchemyBoardComponent);
