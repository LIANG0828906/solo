import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhysicsEngine } from './PhysicsEngine';
import { LevelBuilder } from './LevelBuilder';
import { Playground } from './components/Playground';
import { UIOverlay } from './components/UIOverlay';
import type { RigidBody, RopeConstraint, Vector2, PhysicsState } from './PhysicsEngine';
import type { LevelDefinition } from './LevelBuilder';

type GameStatus = 'selecting' | 'building' | 'running' | 'paused' | 'won' | 'lost';

interface PlacedElement {
  id: string;
  body: RigidBody;
}

interface Connection {
  id: string;
  constraint: RopeConstraint;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const STORAGE_KEY = 'physics_puzzle_stars';

function loadStars(): Record<number, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveStars(stars: Record<number, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stars));
  } catch {
    // ignore
  }
}

const LevelSelect: React.FC<{
  levels: LevelDefinition[];
  levelStars: Record<number, number>;
  totalStars: number;
  onSelectLevel: (id: number) => void;
}> = ({ levels, levelStars, totalStars, onSelectLevel }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 20px',
      }}
    >
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #1E40AF, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}
        >
          物理谜题
        </div>
        <div style={{ fontSize: 18, color: '#6B7280' }}>
          Physics Puzzle
        </div>
        <div
          style={{
            marginTop: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth={1}
            />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#B45309' }}>
            {totalStars}
          </span>
          <span style={{ fontSize: 14, color: '#78716C' }}>
            总星数
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 20,
          maxWidth: 1100,
          width: '100%',
        }}
      >
        {levels.map((level, idx) => {
          const stars = levelStars[level.id] || 0;
          return (
            <div
              key={level.id}
              onClick={() => onSelectLevel(level.id)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#E5E7EB',
                  marginBottom: 8,
                  lineHeight: 1,
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                {level.name}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, minHeight: 36 }}>
                {level.description}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3].map((s) => (
                  <svg key={s} width={24} height={24} viewBox="0 0 24 24">
                    <polygon
                      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                      fill={s <= stars ? '#F59E0B' : '#E5E7EB'}
                      stroke={s <= stars ? '#D97706' : '#D1D5DB'}
                      strokeWidth={1}
                    />
                  </svg>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {level.availableElements.slice(0, 4).map((el) => {
                  const iconMap: Record<string, string> = {
                    lever: '🔧',
                    incline: '📐',
                    pulley: '⚙️',
                    anchor: '⚓',
                    rope: '➰',
                  };
                  return (
                    <span
                      key={el}
                      style={{
                        fontSize: 12,
                        padding: '4px 8px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: 4,
                        color: '#6B7280',
                      }}
                    >
                      {iconMap[el] || el}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GameApp: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('selecting');
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [ballBody, setBallBody] = useState<RigidBody | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [steps, setSteps] = useState(0);
  const [stars, setStars] = useState(0);
  const [levelStars, setLevelStars] = useState<Record<number, number>>(loadStars());
  const [trail, setTrail] = useState<Vector2[]>([]);
  const [windowScale, setWindowScale] = useState(1);

  const physicsEngineRef = useRef<PhysicsEngine>(new PhysicsEngine());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const levels = LevelBuilder.getLevels();
  const currentLevel = currentLevelId ? LevelBuilder.getLevel(currentLevelId) : null;
  const totalStars = Object.values(levelStars).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const handleResize = () => {
      const scale = window.innerWidth < 768 ? 0.7 : 1;
      setWindowScale(scale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetLevel = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = null;

    const level = currentLevel;
    if (!level) return;

    const ball = LevelBuilder.createBallBody(level.startPosition);
    setBallBody(ball);
    setPlacedElements([]);
    setConnections([]);
    setElapsedTime(0);
    setSteps(0);
    setStars(0);
    setTrail([]);
    setGameStatus('building');
    physicsEngineRef.current = new PhysicsEngine();
    lastTimeRef.current = 0;
  }, [currentLevel]);

  const selectLevel = useCallback((id: number) => {
    const level = LevelBuilder.getLevel(id);
    if (!level) return;

    setCurrentLevelId(id);
    const ball = LevelBuilder.createBallBody(level.startPosition);
    setBallBody(ball);
    setPlacedElements([]);
    setConnections([]);
    setElapsedTime(0);
    setSteps(0);
    setStars(0);
    setTrail([]);
    setGameStatus('building');
    physicsEngineRef.current = new PhysicsEngine();
  }, []);

  const startBall = useCallback(() => {
    if (!ballBody || !currentLevel) return;

    const level = currentLevel;
    const engine = physicsEngineRef.current;
    const allBodies: RigidBody[] = [
      { ...ballBody, position: { ...ballBody.position }, velocity: { ...ballBody.velocity } },
      ...placedElements.map((p) => ({
        ...p.body,
        position: { ...p.body.position },
        velocity: { ...p.body.velocity },
      })),
    ];
    const allConstraints: RopeConstraint[] = connections.map((c) => ({ ...c.constraint }));

    const state: PhysicsState = {
      bodies: allBodies,
      constraints: allConstraints,
      ballId: 'ball',
      goalPosition: level.goalPosition,
      goalRadius: level.goalRadius,
    };

    engine.setState(state);
    setGameStatus('running');
    lastTimeRef.current = performance.now();

    const capturedPlacedElements = placedElements;
    const capturedConnections = connections;
    let currentTime = 0;
    let currentSteps = steps;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / 30);
      lastTimeRef.current = time;
      currentTime += dt;

      setElapsedTime(currentTime);

      engine.step(dt);
      const newState = engine.getState();
      const newBall = newState.bodies.find((b) => b.id === 'ball');

      if (newBall) {
        setBallBody({ ...newBall });
        setTrail((prev) => {
          const newTrail = [...prev, { ...newBall.position }];
          return newTrail.slice(-100);
        });
      }

      setPlacedElements(
        capturedPlacedElements.map((p) => {
          const updated = newState.bodies.find((b) => b.id === p.id);
          return updated ? { ...p, body: { ...updated } } : p;
        })
      );

      if (engine.checkGoalReached()) {
        const earnedStars = LevelBuilder.calculateStars(level, currentTime, currentSteps);
        setStars(earnedStars);
        setGameStatus('won');
        setLevelStars((prev) => {
          const newStars = { ...prev };
          newStars[level.id] = Math.max(newStars[level.id] || 0, earnedStars);
          saveStars(newStars);
          return newStars;
        });
        return;
      }

      if (engine.checkBallOutOfBounds({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })) {
        setGameStatus('lost');
        return;
      }

      if (currentTime >= level.timeLimit) {
        setGameStatus('lost');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [ballBody, currentLevel, placedElements, connections, steps]);

  const pauseGame = useCallback(() => {
    if (gameStatus === 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setGameStatus('paused');
    }
  }, [gameStatus]);

  const resumeGame = useCallback(() => {
    if (gameStatus !== 'paused' || !currentLevel) return;

    lastTimeRef.current = performance.now();
    setGameStatus('running');

    const level = currentLevel;
    const engine = physicsEngineRef.current;
    const capturedPlacedElements = placedElements;
    let currentTime = elapsedTime;
    let currentSteps = steps;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / 30);
      lastTimeRef.current = time;
      currentTime += dt;

      setElapsedTime(currentTime);

      engine.step(dt);
      const newState = engine.getState();
      const newBall = newState.bodies.find((b) => b.id === 'ball');

      if (newBall) {
        setBallBody({ ...newBall });
        setTrail((prev) => {
          const newTrail = [...prev, { ...newBall.position }];
          return newTrail.slice(-100);
        });
      }

      setPlacedElements(
        capturedPlacedElements.map((p) => {
          const updated = newState.bodies.find((b) => b.id === p.id);
          return updated ? { ...p, body: { ...updated } } : p;
        })
      );

      if (engine.checkGoalReached()) {
        const earnedStars = LevelBuilder.calculateStars(level, currentTime, currentSteps);
        setStars(earnedStars);
        setGameStatus('won');
        setLevelStars((prev) => {
          const newStars = { ...prev };
          newStars[level.id] = Math.max(newStars[level.id] || 0, earnedStars);
          saveStars(newStars);
          return newStars;
        });
        return;
      }

      if (engine.checkBallOutOfBounds({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })) {
        setGameStatus('lost');
        return;
      }

      if (currentTime >= level.timeLimit) {
        setGameStatus('lost');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [gameStatus, currentLevel, placedElements, elapsedTime, steps]);

  const backToLevels = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setGameStatus('selecting');
    setCurrentLevelId(null);
  }, []);

  const nextLevel = useCallback(() => {
    if (!currentLevelId) return;
    const nextId = currentLevelId + 1;
    if (LevelBuilder.getLevel(nextId)) {
      selectLevel(nextId);
    }
  }, [currentLevelId, selectLevel]);

  const handleElementPlaced = useCallback((body: RigidBody) => {
    if (gameStatus !== 'building') return;
    if (!currentLevel) return;
    if (steps >= currentLevel.maxSteps) return;

    setPlacedElements((prev) => [...prev, { id: body.id, body }]);
    setSteps((prev) => prev + 1);
  }, [gameStatus, currentLevel, steps]);

  const handleElementMoved = useCallback((id: string, position: Vector2) => {
    if (gameStatus !== 'building') return;

    setPlacedElements((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, body: { ...p.body, position } } : p
      )
    );
  }, [gameStatus]);

  const handleConnectionCreated = useCallback((constraint: RopeConstraint) => {
    if (gameStatus !== 'building') return;
    if (!currentLevel) return;
    if (steps >= currentLevel.maxSteps) return;

    setConnections((prev) => [...prev, { id: constraint.id, constraint }]);
    setSteps((prev) => prev + 1);
  }, [gameStatus, currentLevel, steps]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (gameStatus === 'selecting') {
    return (
      <LevelSelect
        levels={levels}
        levelStars={levelStars}
        totalStars={totalStars}
        onSelectLevel={selectLevel}
      />
    );
  }

  if (!currentLevel || !ballBody) {
    return null;
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1F2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          transform: `scale(${windowScale})`,
          transformOrigin: 'center center',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <Playground
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          bodies={[ballBody]}
          constraints={[]}
          goalPosition={currentLevel.goalPosition}
          goalRadius={currentLevel.goalRadius}
          startPosition={currentLevel.startPosition}
          placedElements={placedElements}
          connections={connections}
          isRunning={gameStatus === 'running'}
          isPaused={gameStatus === 'paused'}
          availableElements={currentLevel.availableElements}
          onElementPlaced={handleElementPlaced}
          onElementMoved={handleElementMoved}
          onConnectionCreated={handleConnectionCreated}
          onStartBall={startBall}
          trail={trail}
        />
        <UIOverlay
          elapsedTime={elapsedTime}
          timeLimit={currentLevel.timeLimit}
          steps={steps}
          maxSteps={currentLevel.maxSteps}
          isRunning={gameStatus === 'running'}
          isPaused={gameStatus === 'paused'}
          isWon={gameStatus === 'won'}
          isLost={gameStatus === 'lost'}
          stars={stars}
          levelName={currentLevel.name}
          levelDescription={currentLevel.description}
          onReset={resetLevel}
          onPause={pauseGame}
          onResume={resumeGame}
          onBackToLevels={backToLevels}
          onNextLevel={nextLevel}
          hasNextLevel={!!LevelBuilder.getLevel(currentLevel.id + 1)}
        />
      </div>
    </div>
  );
};
