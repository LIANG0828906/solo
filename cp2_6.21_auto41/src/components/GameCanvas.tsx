import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  useGameStore,
  useGrid,
  useHoveredCell,
  useBuildMenu,
  useIsShiftPressed,
  useSelectedBuilding,
  useEnvironmentalCrisis,
  useProsperityBoost,
  useAffectedCells,
  useResources
} from '../store/gameStore';
import { GRID_SIZE, BUILDING_CONFIGS, BuildingType, FRAME_TIME } from '../types/gameTypes';
import { canBuildAt, validateBuildingPlacement } from '../core/buildingRules';
import BuildMenu from './BuildMenu';
import './GameCanvas.css';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeAccumulatorRef = useRef<number>(0);
  const [cellSize, setCellSize] = useState(28);
  const [canvasSize, setCanvasSize] = useState({ width: 560, height: 560 });

  const grid = useGrid();
  const hoveredCell = useHoveredCell();
  const buildMenu = useBuildMenu();
  const isShiftPressed = useIsShiftPressed();
  const selectedBuilding = useSelectedBuilding();
  const hasCrisis = useEnvironmentalCrisis();
  const hasProsperity = useProsperityBoost();
  const affectedCells = useAffectedCells();
  const resources = useResources();

  const {
    setHoveredCell,
    setBuildMenu,
    buildBuilding,
    removeBuilding,
    setShiftPressed,
    setSelectedBuilding
  } = useGameStore();

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const maxWidth = Math.min(container.clientWidth - 40, 700);
      const newCellSize = Math.floor(maxWidth / GRID_SIZE);
      const size = newCellSize * GRID_SIZE;
      
      setCellSize(newCellSize);
      setCanvasSize({ width: size, height: size });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getCellFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  }, [cellSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    setHoveredCell(cell);
  }, [getCellFromEvent, setHoveredCell]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const gridCell = grid[cell.y][cell.x];
    
    if (buildMenu) {
      setBuildMenu(null);
      return;
    }

    if (isShiftPressed && selectedBuilding) {
      if (gridCell.building === 'empty') {
        const validation = validateBuildingPlacement(grid, cell.x, cell.y, selectedBuilding, resources.money);
        if (validation.valid) {
          buildBuilding(cell.x, cell.y, selectedBuilding);
        }
      }
    } else if (gridCell.building === 'empty') {
      if (canBuildAt(grid, cell.x, cell.y, 'residential', resources.money)) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setBuildMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            cellX: cell.x,
            cellY: cell.y
          });
        }
      }
    } else if (gridCell.building !== 'road') {
      const confirmed = window.confirm(`确定要拆除${BUILDING_CONFIGS[gridCell.building].name}吗？\n将退还50%建造费用。`);
      if (confirmed) {
        removeBuilding(cell.x, cell.y);
      }
    }
  }, [grid, buildMenu, isShiftPressed, selectedBuilding, resources.money, getCellFromEvent, setBuildMenu, buildBuilding, removeBuilding]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const gridCell = grid[cell.y][cell.x];
    if (gridCell.building !== 'empty' && gridCell.building !== 'road') {
      const confirmed = window.confirm(`确定要拆除${BUILDING_CONFIGS[gridCell.building].name}吗？\n将退还50%建造费用。`);
      if (confirmed) {
        removeBuilding(cell.x, cell.y);
      }
    }
  }, [grid, getCellFromEvent, removeBuilding]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
      }
      if (e.key === 'Escape') {
        setBuildMenu(null);
      }
      if (e.key === '1') setSelectedBuilding('residential');
      if (e.key === '2') setSelectedBuilding('commercial');
      if (e.key === '3') setSelectedBuilding('industrial');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setShiftPressed, setBuildMenu, setSelectedBuilding]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      timeAccumulatorRef.current += deltaTime;

      while (timeAccumulatorRef.current >= FRAME_TIME) {
        timeAccumulatorRef.current -= FRAME_TIME;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = grid[y][x];
          const px = x * cellSize;
          const py = y * cellSize;
          const isHovered = hoveredCell && hoveredCell.x === x && hoveredCell.y === y;
          const isAffected = affectedCells.has(`${x},${y}`);
          const building = cell.building;

          if (building !== 'empty') {
            ctx.fillStyle = BUILDING_CONFIGS[building].color;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

            if (hasCrisis && building !== 'road') {
              const pulse = Math.sin(timestamp / 500) * 0.5 + 0.5;
              ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
              ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            }

            if (hasProsperity && building === 'commercial') {
              const pulse = Math.sin(timestamp / 300) * 0.5 + 0.5;
              ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
              ctx.lineWidth = 2;
              ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
            }

            if (isAffected) {
              const pulse = Math.sin(timestamp / 200) * 0.5 + 0.5;
              ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 + pulse * 0.5})`;
              ctx.lineWidth = 3;
              ctx.strokeRect(px, py, cellSize, cellSize);
            }
          }

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);

          if (isHovered) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 4;
            ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.shadowBlur = 0;
          }

          if (selectedBuilding && building === 'empty' && isHovered) {
            const canBuild = canBuildAt(grid, x, y, selectedBuilding, resources.money);
            const baseColor = BUILDING_CONFIGS[selectedBuilding].color;
            
            if (canBuild) {
              ctx.fillStyle = `${baseColor}55`;
              ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
              
              ctx.strokeStyle = `${baseColor}aa`;
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
              ctx.setLineDash([]);
            } else {
              ctx.fillStyle = 'rgba(255, 50, 50, 0.35)';
              ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
              
              ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
              ctx.setLineDash([]);
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = `${Math.floor(cellSize * 0.5)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✕', px + cellSize / 2, py + cellSize / 2);
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [grid, cellSize, hoveredCell, isShiftPressed, selectedBuilding, hasCrisis, hasProsperity, affectedCells, resources.money]);

  return (
    <div className="game-canvas-container" ref={containerRef}>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="game-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        />
        {buildMenu && <BuildMenu menu={buildMenu} />}
      </div>
      <div className="canvas-controls">
        <div className="quick-select">
          <span className="quick-select-label">快捷键:</span>
          <button 
            className={`quick-btn ${selectedBuilding === 'residential' ? 'active' : ''}`}
            style={{ backgroundColor: BUILDING_CONFIGS.residential.color }}
            onClick={() => setSelectedBuilding('residential')}
            title="住宅 (1)"
          >
            🏠
          </button>
          <button 
            className={`quick-btn ${selectedBuilding === 'commercial' ? 'active' : ''}`}
            style={{ backgroundColor: BUILDING_CONFIGS.commercial.color }}
            onClick={() => setSelectedBuilding('commercial')}
            title="商业 (2)"
          >
            🏪
          </button>
          <button 
            className={`quick-btn ${selectedBuilding === 'industrial' ? 'active' : ''}`}
            style={{ backgroundColor: BUILDING_CONFIGS.industrial.color }}
            onClick={() => setSelectedBuilding('industrial')}
            title="工业 (3)"
          >
            🏭
          </button>
        </div>
        <div className="shift-hint">
          {isShiftPressed ? (
            <span className="shift-active">⚡ 快速建造模式</span>
          ) : (
            <span className="shift-inactive">按住 Shift 快速建造</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
