import { useState, useEffect, useCallback, useRef } from 'react';
import { generateMaze, measurePerformance } from './mazeGenerator';
import { findPath } from './pathFinder';
import {
  addTower,
  removeTower,
  getCoverage,
  getBlockedCells,
  getTowerAtPosition,
  TOWER_CONFIGS,
} from './towerManager';
import MazeGrid from './components/MazeGrid';
import TowerPanel from './components/TowerPanel';
import PathLayer from './components/PathLayer';
import CoverageLayer from './components/CoverageLayer';
import DataPanel from './components/DataPanel';
import Tower from './components/Tower';
import type {
  MazeGrid as MazeGridType,
  Point,
  Tower as TowerType,
  TowerType as TowerTypeEnum,
  CoverageArea,
  CoverageStats,
  DragState,
} from './types';

const MAZE_WIDTH = 9;
const MAZE_HEIGHT = 9;
const CELL_SIZE = 60;
const START_POINT: Point = { x: 0, y: 0 };
const END_POINT: Point = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };

export default function App() {
  const [maze, setMaze] = useState<MazeGridType>(() =>
    measurePerformance(() => generateMaze(MAZE_WIDTH, MAZE_HEIGHT))
  );
  const [towers, setTowers] = useState<TowerType[]>([]);
  const [path, setPath] = useState<Point[]>([]);
  const [isPathBlocked, setIsPathBlocked] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Point | null>(null);
  const [showTowerPanel, setShowTowerPanel] = useState(false);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerTypeEnum | null>(null);
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mazeKey, setMazeKey] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    towerType: null,
    position: null,
  });

  const mazeContainerRef = useRef<HTMLDivElement>(null);
  const pathUpdateTimeoutRef = useRef<number | null>(null);

  const updatePathAndCoverage = useCallback(() => {
    if (pathUpdateTimeoutRef.current !== null) {
      window.clearTimeout(pathUpdateTimeoutRef.current);
    }

    pathUpdateTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        const blockedCells = getBlockedCells(towers);
        const newPath = measurePerformance(() =>
          findPath(maze, START_POINT, END_POINT, blockedCells)
        );

        const isBlocked = newPath.length === 0;
        setPath(newPath);
        setIsPathBlocked(isBlocked);

        const { areas, stats } = getCoverage(towers, newPath);
        setCoverageAreas(areas);
        setCoverageStats(stats);
      });
    }, 300);
  }, [maze, towers]);

  useEffect(() => {
    updatePathAndCoverage();

    return () => {
      if (pathUpdateTimeoutRef.current !== null) {
        window.clearTimeout(pathUpdateTimeoutRef.current);
      }
    };
  }, [updatePathAndCoverage]);

  const handleRegenerateMaze = useCallback(() => {
    setIsGenerating(true);
    setShowTowerPanel(false);
    setSelectedCell(null);
    setTowers([]);

    setTimeout(() => {
      requestAnimationFrame(() => {
        const newMaze = measurePerformance(() =>
          generateMaze(MAZE_WIDTH, MAZE_HEIGHT)
        );
        setMaze(newMaze);
        setMazeKey((prev) => prev + 1);
        setIsGenerating(false);
      });
    }, 300);
  }, []);

  const handleCellClick = useCallback(
    (position: Point, _e: React.MouseEvent) => {
      if (maze[position.y][position.x] !== 'path') return;

      const existingTower = getTowerAtPosition(position, towers);
      if (existingTower) return;

      setSelectedCell(position);
      setShowTowerPanel(true);
      setSelectedTowerType(null);
    },
    [maze, towers]
  );

  const handleCellRightClick = useCallback(
    (position: Point, _e: React.MouseEvent) => {
      const existingTower = getTowerAtPosition(position, towers);
      if (existingTower) {
        setTowers((prev) => removeTower(existingTower.id, prev));
      }
      setShowTowerPanel(false);
      setSelectedCell(null);
    },
    [towers]
  );

  const handleCellDragStart = useCallback(
    (position: Point, _e: React.MouseEvent) => {
      if (maze[position.y][position.x] !== 'path') return;
      if (showTowerPanel) {
        setShowTowerPanel(false);
        setSelectedCell(null);
      }
    },
    [maze, showTowerPanel]
  );

  const handleTowerSelect = useCallback(
    (type: TowerTypeEnum) => {
      if (!selectedCell) return;

      const newTower = addTower(type, selectedCell, towers);
      if (newTower) {
        setTowers((prev) => [...prev, newTower]);
        setShowTowerPanel(false);
        setSelectedCell(null);
        setSelectedTowerType(null);
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    },
    [selectedCell, towers]
  );

  const handleRemoveTower = useCallback((towerId: string) => {
    setTowers((prev) => removeTower(towerId, prev));
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowTowerPanel(false);
    setSelectedCell(null);
    setSelectedTowerType(null);
  }, []);

  const handleContainerClick = useCallback(() => {
    setShowTowerPanel(false);
    setSelectedCell(null);
    setSelectedTowerType(null);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        setDragState((prev) => ({
          ...prev,
          position: { x: e.clientX, y: e.clientY },
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragState.isDragging && dragState.towerType && mazeContainerRef.current) {
        const rect = mazeContainerRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

        if (
          x >= 0 &&
          x < MAZE_WIDTH &&
          y >= 0 &&
          y < MAZE_HEIGHT &&
          maze[y][x] === 'path'
        ) {
          const newTower = addTower(dragState.towerType, { x, y }, towers);
          if (newTower) {
            setTowers((prev) => [...prev, newTower]);
          }
        }
      }

      setDragState({
        isDragging: false,
        towerType: null,
        position: null,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.towerType, maze, towers]);

  const pathSteps = path.length > 0 ? path.length - 1 : 0;

  return (
    <div className="app">
      <div className="top-bar">
        <h1 className="title">迷宫塔防</h1>
        <button
          className={`regenerate-btn ${isGenerating ? 'rotating' : ''}`}
          onClick={handleRegenerateMaze}
          disabled={isGenerating}
        >
          🔄 重新生成
        </button>
      </div>

      <div className="main-container">
        <div className="maze-wrapper">
          <div
            ref={mazeContainerRef}
            className={`maze-container ${isPathBlocked ? 'blocked' : ''}`}
            onClick={handleContainerClick}
          >
            <MazeGrid
              maze={maze}
              cellSize={CELL_SIZE}
              onCellClick={handleCellClick}
              onCellRightClick={handleCellRightClick}
              onCellDragStart={handleCellDragStart}
              mazeKey={mazeKey}
            />

            <CoverageLayer
              areas={coverageAreas}
              stats={coverageStats}
              path={path}
              cellSize={CELL_SIZE}
            />

            <PathLayer
              path={path}
              cellSize={CELL_SIZE}
              isBlocked={isPathBlocked}
            />

            {towers.map((tower) => (
              <Tower
                key={tower.id}
                tower={tower}
                cellSize={CELL_SIZE}
                onRemove={handleRemoveTower}
              />
            ))}

            {showTowerPanel && selectedCell && (
              <TowerPanel
                position={selectedCell}
                onSelect={handleTowerSelect}
                onClose={handleClosePanel}
                selectedType={selectedTowerType}
                cellSize={CELL_SIZE}
              />
            )}
          </div>
        </div>

        <DataPanel
          towerCount={towers.length}
          coverageStats={coverageStats}
          pathSteps={pathSteps}
        />
      </div>

      {dragState.isDragging && dragState.towerType && dragState.position && (
        <div
          className="drag-follow"
          style={{
            left: dragState.position.x,
            top: dragState.position.y,
            backgroundColor: TOWER_CONFIGS[dragState.towerType].color,
          }}
        />
      )}

      {showWarning && (
        <div className="warning-toast">
          ⚠️ 该位置已被占用，请选择其他位置
        </div>
      )}

      {isPathBlocked && (
        <div className="warning-toast" style={{ top: '120px' }}>
          🚫 路径已被完全阻挡！请撤除部分炮塔
        </div>
      )}
    </div>
  );
}
