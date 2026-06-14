import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  drawGrid,
  pixelToHex,
  getHexesInRange,
  findPath,
  animateUnitMove,
  MOVE_RANGE
} from '../core/hexGrid';

export default function MapContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelAnimationRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    gridSize,
    hexRadius,
    units,
    selectedUnitId,
    selectedUnitType,
    highlightedHexes,
    isAnimating,
    animationUnitId,
    animationPath,
    animationProgress,
    selectUnit,
    selectUnitType,
    deployUnit,
    setHighlightedHexes,
    startAnimation,
    updateAnimationProgress,
    finishAnimation
  } = useGameStore();

  const offsetRef = useRef({ x: 0, y: 0 });

  const calculateOffsets = useCallback((canvas: HTMLCanvasElement) => {
    const gridPixelWidth = hexRadius * 3 / 2 * (gridSize - 1) + hexRadius * 2;
    const gridPixelHeight = hexRadius * Math.sqrt(3) * (gridSize - 1) + hexRadius * Math.sqrt(3);
    
    offsetRef.current = {
      x: (canvas.width - gridPixelWidth) / 2 + hexRadius,
      y: (canvas.height - gridPixelHeight) / 2 + hexRadius * Math.sqrt(3) / 2
    };
  }, [gridSize, hexRadius]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(
      ctx,
      gridSize,
      hexRadius,
      offsetRef.current.x,
      offsetRef.current.y,
      highlightedHexes,
      units,
      selectedUnitId,
      isAnimating,
      animationUnitId,
      animationPath,
      animationProgress
    );
  }, [
    gridSize,
    hexRadius,
    highlightedHexes,
    units,
    selectedUnitId,
    isAnimating,
    animationUnitId,
    animationPath,
    animationProgress
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      calculateOffsets(canvas);
      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [calculateOffsets, render]);

  useEffect(() => {
    if (isAnimating) return;
    
    animationFrameRef.current = requestAnimationFrame(function loop() {
      render();
      animationFrameRef.current = requestAnimationFrame(loop);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render, isAnimating]);

  useEffect(() => {
    if (!selectedUnitId || isAnimating) {
      setHighlightedHexes([]);
      return;
    }

    const selectedUnit = units.find(u => u.id === selectedUnitId);
    if (!selectedUnit || selectedUnit.hasActed) {
      setHighlightedHexes([]);
      return;
    }

    const reachable = getHexesInRange(
      { q: selectedUnit.q, r: selectedUnit.r },
      MOVE_RANGE,
      gridSize
    ).filter(hex => {
      if (hex.q === selectedUnit.q && hex.r === selectedUnit.r) return false;
      const occupied = units.some(u => u.q === hex.q && u.r === hex.r && u.id !== selectedUnitId);
      return !occupied;
    });

    setHighlightedHexes(reachable);
  }, [selectedUnitId, units, gridSize, isAnimating, setHighlightedHexes]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hex = pixelToHex(x, y, hexRadius, offsetRef.current.x, offsetRef.current.y);

    if (hex.q < 0 || hex.q >= gridSize || hex.r < 0 || hex.r >= gridSize) {
      return;
    }

    const clickedUnit = units.find(u => u.q === hex.q && u.r === hex.r);

    if (selectedUnitType) {
      if (!clickedUnit) {
        deployUnit(hex.q, hex.r);
      }
      return;
    }

    if (selectedUnitId) {
      const selectedUnit = units.find(u => u.id === selectedUnitId);
      if (!selectedUnit || selectedUnit.hasActed) {
        selectUnit(null);
        return;
      }

      if (clickedUnit && clickedUnit.id === selectedUnitId) {
        selectUnit(null);
        return;
      }

      const isHighlighted = highlightedHexes.some(h => h.q === hex.q && h.r === hex.r);
      if (isHighlighted) {
        const path = findPath(
          { q: selectedUnit.q, r: selectedUnit.r },
          hex,
          units,
          gridSize,
          MOVE_RANGE
        );

        if (path.length > 1) {
          startAnimation(selectedUnitId, path);
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (cancelAnimationRef.current) {
              cancelAnimationRef.current();
            }
            
            cancelAnimationRef.current = animateUnitMove(
              ctx,
              path,
              gridSize,
              hexRadius,
              offsetRef.current.x,
              offsetRef.current.y,
              units,
              selectedUnitId,
              highlightedHexes,
              selectedUnitId,
              (progress) => {
                updateAnimationProgress(progress);
              },
              () => {
                finishAnimation();
                cancelAnimationRef.current = null;
              }
            );
          }
        }
      } else if (clickedUnit) {
        selectUnit(clickedUnit.id);
      } else {
        selectUnit(null);
      }
    } else if (clickedUnit) {
      selectUnit(clickedUnit.id);
    }
  }, [
    isAnimating,
    hexRadius,
    gridSize,
    units,
    selectedUnitType,
    selectedUnitId,
    highlightedHexes,
    selectUnit,
    selectUnitType,
    deployUnit,
    startAnimation,
    updateAnimationProgress,
    finishAnimation
  ]);

  return (
    <div className="map-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`game-canvas ${selectedUnitType ? 'deploy-mode' : ''} ${selectedUnitId ? 'move-mode' : ''}`}
      />
      <div className="map-overlay">
        <div className="coords-hint">
          六边形网格 8×8 | 移动范围 2 格
        </div>
      </div>
    </div>
  );
}
