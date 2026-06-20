import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ElementType,
  ELEMENTS,
  analyzeChain,
  GESTURE_LAYOUT,
} from '../domain/elementData';
import {
  calculateCombat,
  createInitialSpirit,
  createRandomEffect,
  SpiritState,
  VisualEffect,
  CombatResult,
} from '../domain/combatEngine';
import { CanvasRenderer } from './draw';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 450;
const MAX_CHAIN_LENGTH = 5;

const GESTURE_ORDER: ElementType[] = ['fire', 'water', 'wood', 'earth', 'thunder'];

interface GestureButtonProps {
  element: ElementType;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const GestureButton: React.FC<GestureButtonProps> = React.memo(({ element, onClick }) => {
  const info = ELEMENTS[element];
  const [pressed, setPressed] = useState(false);

  const handleMouseDown = () => setPressed(true);
  const handleMouseUp = () => setTimeout(() => setPressed(false), 150);

  return (
    <button
      onClick={(e) => {
        onClick(e);
        handleMouseDown();
        handleMouseUp();
      }}
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.3)',
        background: `radial-gradient(circle at 30% 30%, ${info.color}, ${info.color}dd)`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        boxShadow: `0 0 15px ${info.glowColor}, inset 0 -5px 10px rgba(0,0,0,0.3)`,
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setPressed(false)}
    >
      {info.icon}
    </button>
  );
});

interface ChainDotProps {
  element: ElementType;
  index: number;
  onClick: () => void;
}

const ChainDot: React.FC<ChainDotProps> = React.memo(({ element, index, onClick }) => {
  const info = ELEMENTS[element];
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={() => {
        onClick();
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
      }}
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: info.color,
        cursor: 'pointer',
        boxShadow: `0 0 8px ${info.glowColor}`,
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        position: 'relative',
      }}
      title={`第${index + 1}步：${info.name} - 点击删除`}
    >
      <span
        style={{
          position: 'absolute',
          top: '-22px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: '#fff',
          opacity: 0.8,
          whiteSpace: 'nowrap',
        }}
      >
        {index + 1}
      </span>
    </div>
  );
});

export function App(): JSX.Element {
  const [chain, setChain] = useState<ElementType[]>([]);
  const [spirit, setSpirit] = useState<SpiritState | null>(null);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [lastDamage, setLastDamage] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const randomEffectTimerRef = useRef<number>(0);
  const rippleRafRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current, CANVAS_WIDTH, CANVAS_HEIGHT);

    const animate = (time: number) => {
      if (rendererRef.current && spirit) {
        const now = performance.now();
        const activeEffects = effects.filter(
          (e) => now - e.startTime < e.duration
        );
        rendererRef.current.render(spirit, activeEffects, now);
      } else if (rendererRef.current) {
        rendererRef.current.render(null, [], time);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [spirit, effects]);

  useEffect(() => {
    if (!spirit) return;

    const triggerRandomEffect = () => {
      const now = performance.now();
      const effect = createRandomEffect(spirit, now);
      if (effect) {
        setEffects((prev) => [...prev, effect]);
      }
    };

    randomEffectTimerRef.current = window.setInterval(triggerRandomEffect, 2000);

    return () => {
      clearInterval(randomEffectTimerRef.current);
    };
  }, [spirit]);

  useEffect(() => {
    if (spirit && combatResult) {
      setSpirit((prev) => (prev ? { ...prev, scale: combatResult.spiritScale } : prev));
    }
  }, [combatResult]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    rendererRef.current.setMousePosition(x, y);
  }, []);

  const triggerRipple = useCallback((x: number, y: number, color: string) => {
    if (!canvasRef.current || !rendererRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    rendererRef.current.addRipple(canvasX, canvasY, color);
  }, []);

  const handleGestureClick = useCallback(
    (element: ElementType) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (chain.length >= MAX_CHAIN_LENGTH) return;

      const newChain = [...chain, element];
      setChain(newChain);

      const now = performance.now();
      const reaction = analyzeChain(newChain);

      const newSpirit = createInitialSpirit(reaction.mainElement, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (!spirit) {
        setSpirit(newSpirit);
      } else {
        setSpirit((prev) =>
          prev ? { ...prev, element: reaction.mainElement, breathePhase: Math.random() * Math.PI * 2 } : prev
        );
      }

      const result = calculateCombat(newChain, reaction, CANVAS_WIDTH, CANVAS_HEIGHT, now);
      setCombatResult(result);
      setLastDamage(result.damage);
      setEffects((prev) => {
        const stillActive = prev.filter((eff) => now - eff.startTime < eff.duration);
        return [...stillActive, ...result.effects];
      });

      if (canvasRef.current) {
        triggerRipple(e.clientX, e.clientY, ELEMENTS[element].glowColor);
      }
    },
    [chain, spirit, triggerRipple]
  );

  const handleChainDotClick = useCallback((index: number) => {
    setChain((prev) => {
      const newChain = prev.filter((_, i) => i !== index);
      if (newChain.length === 0) {
        setSpirit(null);
        setCombatResult(null);
        setEffects([]);
        setLastDamage(0);
      } else {
        const now = performance.now();
        const reaction = analyzeChain(newChain);
        setSpirit((prevSpirit) =>
          prevSpirit ? { ...prevSpirit, element: reaction.mainElement } : null
        );
        const result = calculateCombat(newChain, reaction, CANVAS_WIDTH, CANVAS_HEIGHT, now);
        setCombatResult(result);
        setLastDamage(result.damage);
        setEffects((prevEffects) => {
          const stillActive = prevEffects.filter((eff) => now - eff.startTime < eff.duration);
          return [...stillActive, ...result.effects];
        });
      }
      return newChain;
    });
  }, []);

  const handleReset = useCallback(() => {
    setChain([]);
    setSpirit(null);
    setCombatResult(null);
    setEffects([]);
    setLastDamage(0);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#1A0A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        color: '#fff',
      }}
    >
      <h1
        style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          background: 'linear-gradient(135deg, #E879F9, #A78BFA, #60A5FA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(168,85,247,0.4)',
          letterSpacing: '4px',
        }}
      >
        ⚔️ 元素之灵召唤术 ⚔️
      </h1>
      <p
        style={{
          margin: '0 0 20px 0',
          color: '#A78BFA',
          fontSize: '14px',
          opacity: 0.8,
        }}
      >
        点击下方元素手势组成结印链（最多5步），召唤专属元素之灵！
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '40%',
          minHeight: '280px',
          backgroundColor: '#2C1E4A',
          borderRadius: '16px',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          marginBottom: '16px',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              color: '#C4B5FD',
            }}
          >
            <span>🔮 结印链</span>
            <span style={{ color: '#E9D5FF' }}>
              [{chain.length}/{MAX_CHAIN_LENGTH}]
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              minHeight: '40px',
              padding: '8px 16px',
              backgroundColor: 'rgba(139,92,246,0.1)',
              borderRadius: '20px',
              border: '1px dashed rgba(139,92,246,0.4)',
            }}
          >
            {chain.length === 0 ? (
              <span style={{ color: '#8B5CF6', opacity: 0.6, fontSize: '13px' }}>
                请点击下方元素手势开始结印...
              </span>
            ) : (
              chain.map((element, index) => (
                <React.Fragment key={index}>
                  <ChainDot
                    element={element}
                    index={index}
                    onClick={() => handleChainDotClick(index)}
                  />
                  {index < chain.length - 1 && (
                    <span
                      style={{
                        color: '#A78BFA',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      →
                    </span>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gridTemplateRows: 'repeat(3, 80px)',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {GESTURE_LAYOUT.flat().map((element, index) =>
            element ? (
              <GestureButton
                key={`${element}-${index}`}
                element={element}
                onClick={handleGestureClick(element)}
              />
            ) : (
              <div key={`empty-${index}`} style={{ width: '60px', height: '60px' }} />
            )
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: '1px solid rgba(239,68,68,0.5)',
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#FCA5A5',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔄 重置结印
          </button>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '60%',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {combatResult && (
          <div
            style={{
              width: CANVAS_WIDTH,
              display: 'flex',
              justifyContent: 'space-around',
              backgroundColor: 'rgba(44,30,74,0.8)',
              borderRadius: '12px',
              padding: '12px 20px',
              boxSizing: 'border-box',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#A78BFA' }}>基础伤害</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#E0E7FF' }}>
                {combatResult.baseDamage}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#86EFAC' }}>相生增益</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#86EFAC' }}>
                +{(combatResult.generateBonus * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#FCA5A5' }}>相克加成</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FCA5A5' }}>
                +{(combatResult.overcomeBonus * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#FDE047' }}>总伤害</div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: combatResult.displayColor,
                  textShadow: `0 0 10px ${combatResult.displayColor}`,
                }}
              >
                {combatResult.damage}
              </div>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleCanvasMouseMove}
          style={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1)',
            cursor: spirit ? 'crosshair' : 'default',
          }}
        />

        <div
          style={{
            width: CANVAS_WIDTH,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#A78BFA',
            opacity: 0.7,
            padding: '0 8px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            相克：火→木→水→火、土↔雷
          </div>
          <div>
            相生：水→木→火→土→雷→水
          </div>
        </div>
      </div>
    </div>
  );
}
