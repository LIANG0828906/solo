import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SeedType,
  Plant,
  Point,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_WIDTH,
  CELL_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  MAX_PLANTS,
  COLLISION_INTERVAL,
  SEED_COLORS,
  SEED_NAMES
} from './types';
import {
  createPlant,
  updatePlant,
  checkCollision,
  processCollision,
  getCollisionCenter,
  mixColors
} from './PlantSimulator';
import { Renderer } from './Renderer';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const plantsRef = useRef<Plant[]>([]);
  const frameCountRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [selectedSeed, setSelectedSeed] = useState<SeedType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const [, setTick] = useState(0);
  const [scale, setScale] = useState(1);
  const [isClearing, setIsClearing] = useState(false);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return { x, y };
  }, []);

  const snapToGrid = useCallback((point: Point): { gridX: number; gridY: number } => {
    const gridX = Math.min(Math.max(Math.floor(point.x / CELL_WIDTH), 0), GRID_COLS - 1);
    const gridY = Math.min(Math.max(Math.floor(point.y / CELL_HEIGHT), 0), GRID_ROWS - 1);
    return { gridX, gridY };
  }, []);

  const handleSeedSelect = useCallback((type: SeedType) => {
    if (isClearing) return;
    setSelectedSeed(prev => prev === type ? null : type);
    setIsDragging(false);
    setDragPosition(null);
  }, [isClearing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedSeed || isClearing) return;
    const coords = getCanvasCoords(e);
    setIsDragging(true);
    setDragPosition(coords);
  }, [selectedSeed, isClearing, getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    setDragPosition(coords);
  }, [isDragging, getCanvasCoords]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!selectedSeed || !isDragging || isClearing) {
      setIsDragging(false);
      setDragPosition(null);
      return;
    }

    const target = e.target as HTMLElement;
    if (!target.closest('.canvas-container')) {
      setIsDragging(false);
      setDragPosition(null);
      return;
    }

    const coords = getCanvasCoords(e);
    const { gridX, gridY } = snapToGrid(coords);

    const occupied = plantsRef.current.some(
      p => p.gridX === gridX && p.gridY === gridY && p.state !== 'clearing'
    );

    if (!occupied && plantsRef.current.filter(p => p.state !== 'clearing').length < MAX_PLANTS) {
      const plant = createPlant(selectedSeed, gridX, gridY);
      plantsRef.current.push(plant);
    }

    setIsDragging(false);
    setDragPosition(null);
    setSelectedSeed(null);
  }, [selectedSeed, isDragging, isClearing, getCanvasCoords, snapToGrid]);

  const handleCanvasClick = useCallback(() => {
    if (!isDragging) {
      setSelectedSeed(null);
    }
  }, [isDragging]);

  const handleClear = useCallback(() => {
    if (isClearing) return;
    setIsClearing(true);
    for (const plant of plantsRef.current) {
      if (plant.state !== 'clearing') {
        plant.state = 'clearing';
        plant.reverseProgress = 1;
      }
    }
    setTimeout(() => {
      plantsRef.current = [];
      setIsClearing(false);
    }, 600);
  }, [isClearing]);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const containerRatio = containerWidth / containerHeight;

    let newScale: number;
    if (containerRatio > targetRatio) {
      newScale = containerHeight / CANVAS_HEIGHT;
    } else {
      newScale = containerWidth / CANVAS_WIDTH;
    }
    setScale(newScale);
  }, []);

  useEffect(() => {
    const canvas2D = canvas2DRef.current;
    const canvas3D = canvas3DRef.current;
    if (!canvas2D || !canvas3D) return;

    canvas2D.width = CANVAS_WIDTH;
    canvas2D.height = CANVAS_HEIGHT;
    canvas3D.width = CANVAS_WIDTH;
    canvas3D.height = CANVAS_HEIGHT;

    rendererRef.current = new Renderer(canvas2D, canvas3D);
    handleResize();

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? Math.min((currentTime - lastTimeRef.current) / 1000, 0.05) : 0.016;
      lastTimeRef.current = currentTime;

      frameCountRef.current++;

      for (const plant of plantsRef.current) {
        updatePlant(plant, deltaTime);
      }

      plantsRef.current = plantsRef.current.filter(p => !(p.state === 'clearing' && (p.reverseProgress ?? 0) <= 0));

      if (frameCountRef.current % COLLISION_INTERVAL === 0) {
        const alivePlants = plantsRef.current.filter(p => p.state !== 'clearing');
        for (let i = 0; i < alivePlants.length; i++) {
          for (let j = i + 1; j < alivePlants.length; j++) {
            if (checkCollision(alivePlants[i], alivePlants[j])) {
              const center = getCollisionCenter(alivePlants[i], alivePlants[j]);
              const colorA = SEED_COLORS[alivePlants[i].type];
              const colorB = SEED_COLORS[alivePlants[j].type];
              const mixed = mixColors(colorA, colorB);
              processCollision({
                plantA: alivePlants[i],
                plantB: alivePlants[j],
                mixedColor: mixed,
                centerPoint: center
              });
              if (rendererRef.current) {
                rendererRef.current.emitExplosion(center, mixed);
              }
            }
          }
        }
      }

      if (rendererRef.current) {
        rendererRef.current.updateParticles(deltaTime);
        rendererRef.current.renderPlants(plantsRef.current, dragPosition, selectedSeed);
        rendererRef.current.renderParticles();
      }

      setTick(t => (t + 1) % 1000000);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      rendererRef.current?.dispose();
    };
  }, [handleResize, dragPosition, selectedSeed]);

  const seedTypes: SeedType[] = ['vine', 'mushroom', 'glowmoss'];

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      overflow: 'hidden'
    }}>
      <div style={{
        width: 200,
        minWidth: 200,
        height: '100%',
        backgroundColor: 'rgba(44, 44, 44, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflow: 'auto'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 4,
          letterSpacing: 0.5
        }}>
          种子面板
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 12,
          marginTop: -8,
          marginBottom: 8
        }}>
          选择种子后拖入画布
        </p>

        {seedTypes.map((type) => {
          const color = SEED_COLORS[type];
          const isSelected = selectedSeed === type;
          return (
            <div
              key={type}
              onClick={() => handleSeedSelect(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                cursor: 'pointer',
                border: isSelected ? `2px solid ${color.hex}` : '2px solid transparent',
                boxShadow: isSelected ? `0 0 15px ${color.hex}66` : 'none',
                animation: isSelected ? `glow-anim-${type} 1s ease-in-out infinite` : 'none',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: color.hex,
                  boxShadow: `0 0 10px ${color.hex}88`,
                  flexShrink: 0
                }}
              />
              <span style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 500
              }}>
                {SEED_NAMES[type]}
              </span>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleClear}
          disabled={isClearing}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: isClearing ? '#8B0000' : '#C62828',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: isClearing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(198, 40, 40, 0.3)',
            letterSpacing: 1
          }}
          onMouseEnter={(e) => {
            if (!isClearing) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D32F2F';
            }
          }}
          onMouseLeave={(e) => {
            if (!isClearing) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C62828';
            }
          }}
        >
          {isClearing ? '清空中...' : '清空画布'}
        </button>

        <style>{`
          @keyframes glow-anim-vine {
            0%, 100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.4); }
            50% { box-shadow: 0 0 25px rgba(76, 175, 80, 0.8); }
          }
          @keyframes glow-anim-mushroom {
            0%, 100% { box-shadow: 0 0 15px rgba(255, 87, 34, 0.4); }
            50% { box-shadow: 0 0 25px rgba(255, 87, 34, 0.8); }
          }
          @keyframes glow-anim-glowmoss {
            0%, 100% { box-shadow: 0 0 15px rgba(129, 212, 250, 0.4); }
            50% { box-shadow: 0 0 25px rgba(129, 212, 250, 0.8); }
          }
        `}</style>
      </div>

      <div
        ref={containerRef}
        className="canvas-container"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          style={{
            position: 'relative',
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale
          }}
        >
          <canvas
            ref={canvas2DRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 4,
              cursor: selectedSeed ? 'crosshair' : 'default'
            }}
          />
          <canvas
            ref={canvas3DRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 4,
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
