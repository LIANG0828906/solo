import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine';
import { AnimationRenderer } from './animation/AnimationRenderer';
import { LEVELS } from './data/LevelData';
import type { GroovePosition } from './data/LevelData';
import { getElementColor, type ElementType } from './utils/helpers';
import type { EngineEvents } from './engine/GameEngine';

interface RunePosition {
  x: number;
  y: number;
}

interface DragState {
  runeId: string;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
}

const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  steam: '蒸汽',
  lava: '熔岩'
};

function App() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 6 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState<ElementType | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [pulsingGroove, setPulsingGroove] = useState<string | null>(null);
  const [runePositions, setRunePositions] = useState<Map<string, RunePosition>>(new Map());
  const [lockedRunes, setLockedRunes] = useState<Set<string>>(new Set());
  const [lockedGrooves, setLockedGrooves] = useState<Set<string>>(new Set());
  const [targetSequence, setTargetSequence] = useState<ElementType[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<AnimationRenderer | null>(null);
  const dragStateRef = useRef<DragState>({
    runeId: '',
    offsetX: 0,
    offsetY: 0,
    isDragging: false
  });

  const currentLevel = LEVELS[currentLevelIndex];

  const initializeEngine = useCallback(() => {
    const level = LEVELS[currentLevelIndex];
    const engine = new GameEngine(level);
    engineRef.current = engine;

    setProgress(engine.getProgress());
    setRunePositions(engine.getAllRunePositions());
    setTargetSequence(engine.getTargetSequence());
    setCurrentStep(0);
    setIsCompleted(false);
    setLockedRunes(new Set());
    setLockedGrooves(new Set());

    const onElementActivated: EngineEvents['elementActivated'] = (data) => {
      rendererRef.current?.handleEngineEvent('elementActivated', data);
    };

    const onWaveEffect: EngineEvents['waveEffect'] = () => {
      rendererRef.current?.handleEngineEvent('waveEffect', undefined);
    };

    const onProgressUpdated: EngineEvents['progressUpdated'] = (data) => {
      setProgress(data);
      setCurrentStep(data.current);
    };

    const onLevelCompleted: EngineEvents['levelCompleted'] = () => {
      setIsCompleted(true);
    };

    const onLevelReset: EngineEvents['levelReset'] = () => {
      setRunePositions(engine.getAllRunePositions());
      setTargetSequence(engine.getTargetSequence());
      setCurrentStep(0);
      setIsCompleted(false);
      setLockedRunes(new Set());
      setLockedGrooves(new Set());
      rendererRef.current?.clear();
    };

    const onRunePlaced: EngineEvents['runePlaced'] = (data) => {
      if (data.success) {
        setLockedRunes(prev => new Set([...prev, data.runeId]));
        const groove = level.positions.find(g => g.id === data.grooveId);
        if (groove) {
          setLockedGrooves(prev => new Set([...prev, data.grooveId]));
          setRunePositions(prev => {
            const newMap = new Map(prev);
            newMap.set(data.runeId, { x: groove.x, y: groove.y });
            return newMap;
          });
        }
      }
    };

    const onPulseEffect: EngineEvents['pulseEffect'] = (data) => {
      setPulsingGroove(data.grooveId);
      setTimeout(() => setPulsingGroove(null), 500);
    };

    const onChainReaction: EngineEvents['chainReaction'] = () => {
      setTimeout(() => {
        setRunePositions(engine.getAllRunePositions());
      }, 300);
    };

    engine.on('elementActivated', onElementActivated);
    engine.on('waveEffect', onWaveEffect);
    engine.on('progressUpdated', onProgressUpdated);
    engine.on('levelCompleted', onLevelCompleted);
    engine.on('levelReset', onLevelReset);
    engine.on('runePlaced', onRunePlaced);
    engine.on('pulseEffect', onPulseEffect);
    engine.on('chainReaction', onChainReaction);

    return () => {
      engine.off('elementActivated', onElementActivated);
      engine.off('waveEffect', onWaveEffect);
      engine.off('progressUpdated', onProgressUpdated);
      engine.off('levelCompleted', onLevelCompleted);
      engine.off('levelReset', onLevelReset);
      engine.off('runePlaced', onRunePlaced);
      engine.off('pulseEffect', onPulseEffect);
      engine.off('chainReaction', onChainReaction);
    };
  }, [currentLevelIndex]);

  useEffect(() => {
    const cleanup = initializeEngine();

    if (canvasRef.current) {
      const renderer = new AnimationRenderer(canvasRef.current);
      renderer.resize(500, 500);
      renderer.start();
      rendererRef.current = renderer;
    }

    return () => {
      cleanup();
      rendererRef.current?.stop();
    };
  }, [initializeEngine]);

  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current) {
        const width = window.innerWidth < 600 ? 350 : 500;
        rendererRef.current.resize(width, width);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPointerPosition = (e: React.PointerEvent | PointerEvent) => {
    if (!tabletRef.current) return { x: 0, y: 0 };
    const rect = tabletRef.current.getBoundingClientRect();
    const scale = window.innerWidth < 600 ? 350 / 500 : 1;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handlePointerDown = (e: React.PointerEvent, runeId: string) => {
    if (engineRef.current?.isRuneLocked(runeId)) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getPointerPosition(e);
    const runePos = runePositions.get(runeId);
    if (!runePos) return;

    dragStateRef.current = {
      runeId,
      offsetX: pos.x - runePos.x,
      offsetY: pos.y - runePos.y,
      isDragging: true
    };

    setRunePositions(prev => {
      const newMap = new Map(prev);
      return newMap;
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const pos = getPointerPosition(e);
    const { runeId, offsetX, offsetY } = dragStateRef.current;

    setRunePositions(prev => {
      const newMap = new Map(prev);
      newMap.set(runeId, {
        x: pos.x - offsetX,
        y: pos.y - offsetY
      });
      return newMap;
    });
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const { runeId } = dragStateRef.current;
    const runePos = runePositions.get(runeId);

    if (runePos && engineRef.current) {
      const nearestGroove = findNearestGroove(runePos.x, runePos.y);
      if (nearestGroove) {
        engineRef.current.placeRune(runeId, nearestGroove.id);
      }
    }

    dragStateRef.current.isDragging = false;
    dragStateRef.current.runeId = '';
  };

  const findNearestGroove = (x: number, y: number): GroovePosition | null => {
    const level = LEVELS[currentLevelIndex];
    const threshold = 40;
    let nearest: GroovePosition | null = null;
    let minDist = Infinity;

    for (const groove of level.positions) {
      if (lockedGrooves.has(groove.id)) continue;
      const dist = Math.sqrt((x - groove.x) ** 2 + (y - groove.y) ** 2);
      if (dist < threshold && dist < minDist) {
        minDist = dist;
        nearest = groove;
      }
    }

    return nearest;
  };

  const handleReset = () => {
    engineRef.current?.resetLevel();
  };

  const handleHint = () => {
    const hint = engineRef.current?.getHint();
    if (hint) {
      setShowHint(hint);
      setHintText(`下一步: ${ELEMENT_NAMES[hint]}元素`);
      setTimeout(() => {
        setShowHint(null);
        setHintText(null);
      }, 3000);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    }
  };

  const isDragging = (runeId: string) => {
    return dragStateRef.current.isDragging && dragStateRef.current.runeId === runeId;
  };

  return (
    <div className="game-container">
      <div className="hud">
        <div className="level-display">第 {currentLevel.id} 关 · {currentLevel.name}</div>
        <div className="progress-text">
          <span className="completed">{progress.current}</span>
          <span className="remaining"> / {progress.total}</span>
        </div>
      </div>

      {hintText && (
        <div className="hint-display" style={{ borderColor: showHint ? getElementColor(showHint) : '#FFD700' }}>
          {hintText}
        </div>
      )}

      <div className="stone-tablet" ref={tabletRef}>
        <div className="level-name">{currentLevel.name}</div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>

        <canvas ref={canvasRef} className="canvas-layer" />

        <div
          className="rune-layer"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {currentLevel.positions.map(groove => (
            <div
              key={groove.id}
              className={`groove ${pulsingGroove === groove.id ? 'pulse' : ''} ${lockedGrooves.has(groove.id) ? 'locked' : ''}`}
              style={{
                left: groove.x,
                top: groove.y,
                color: getElementColor(groove.element),
                borderColor: getElementColor(groove.element)
              }}
            />
          ))}

          {currentLevel.shapes.map(shape => {
            const pos = runePositions.get(shape.id) || { x: 250, y: 250 };
            const locked = lockedRunes.has(shape.id);
            const dragging = isDragging(shape.id);
            const color = getElementColor(shape.element);

            return (
              <div
                key={shape.id}
                className={`rune ${dragging ? 'dragging' : ''} ${locked ? 'locked' : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  color,
                  pointerEvents: locked ? 'none' : 'auto'
                }}
                onPointerDown={(e) => handlePointerDown(e, shape.id)}
              >
                <svg viewBox="-30 -30 60 60" style={{ color }}>
                  <defs>
                    <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={color} stopOpacity="1" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                    <filter id={`glow-${shape.id}`}>
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={shape.path}
                    fill={`url(#grad-${shape.id})`}
                    stroke={color}
                    strokeWidth="2"
                    filter={`url(#glow-${shape.id})`}
                  />
                </svg>
              </div>
            );
          })}
        </div>

        <div className="sequence-hint">
          {targetSequence.map((element, index) => (
            <div
              key={index}
              className={`sequence-dot ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
              style={{
                backgroundColor: index < currentStep ? getElementColor(element) : 'transparent',
                borderColor: getElementColor(element),
                color: getElementColor(element)
              }}
            />
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-reset" onClick={handleReset}>
          重置
        </button>
        <button className="btn btn-hint" onClick={handleHint}>
          提示
        </button>
        <button
          className="btn btn-next"
          onClick={handleNextLevel}
          disabled={!isCompleted || currentLevelIndex >= LEVELS.length - 1}
        >
          下一关
        </button>
      </div>

      {isCompleted && (
        <div className="completion-overlay">
          <div className="completion-text">封印解除！</div>
          <button className="btn btn-next" onClick={handleNextLevel} disabled={currentLevelIndex >= LEVELS.length - 1}>
            {currentLevelIndex >= LEVELS.length - 1 ? '已通关' : '继续冒险'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
