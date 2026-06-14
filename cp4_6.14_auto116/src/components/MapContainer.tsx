import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  drawGrid,
  pixelToHex,
  getReachableHexes,
  findPath,
  animateUnitMove,
  resetRenderer
} from '../core/hexGrid';

export default function MapContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelAnimationRef = useRef<(() => void) | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const needsRenderRef = useRef(false);

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
      x: (canvas.width / (window.devicePixelRatio || 1) - gridPixelWidth) / 2 + hexRadius,
      y: (canvas.height / (window.devicePixelRatio || 1) - gridPixelHeight) / 2 + hexRadius * Math.sqrt(3) / 2
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      
      resetRenderer();
      calculateOffsets(canvas);
      needsRenderRef.current = true;
      requestRender();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [calculateOffsets]);

  const requestRender = useCallback(() => {
    if (renderFrameRef.current !== null) return;
    
    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null;
      if (needsRenderRef.current) {
        needsRenderRef.current = false;
        render();
      }
    });
  }, [render]);

  useEffect(() => {
    if (isAnimating) return;
    
    needsRenderRef.current = true;
    requestRender();
    
    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
    };
  }, [render, isAnimating, requestRender]);

  useEffect(() => {
    if (!selectedUnitId || isAnimating) {
      setHighlightedHexes([]);
      return;
    }

    const selectedUnit = units.find(u => u.id === selectedUnitId);
    if (!selectedUnit || selectedUnit.hasActed || selectedUnit.actionPoints <= 0) {
      setHighlightedHexes([]);
      return;
    }

    const reachable = getReachableHexes(
      { q: selectedUnit.q, r: selectedUnit.r },
      selectedUnit.actionPoints,
      units,
      gridSize
    );

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
      if (!selectedUnit || selectedUnit.hasActed || selectedUnit.actionPoints <= 0) {
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
          selectedUnit.actionPoints
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
    deployUnit,
    startAnimation,
    updateAnimationProgress,
    finishAnimation
  ]);

  useEffect(() => {
    return () => {
      resetRenderer();
      if (cancelAnimationRef.current) {
        cancelAnimationRef.current();
      }
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="map-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`game-canvas ${selectedUnitType ? 'deploy-mode' : ''} ${selectedUnitId ? 'move-mode' : ''}`}
      />
      <div className="map-overlay">
        <div className="coords-hint">
          六边形网格 8×8 | 每单位 1 点行动力
        </div>
      </div>
    </div>
  );
}
