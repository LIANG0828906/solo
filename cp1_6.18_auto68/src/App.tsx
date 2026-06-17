import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGalleryStore, ViewMode } from '@/store';
import { CanvasRenderer } from '@/engine/CanvasRenderer';
import { CollisionDetector } from '@/engine/CollisionDetector';
import { COLORS, GRID, ROAM, ANIMATION } from '@/shared/styles';
import { pixelToGrid, getCellKey } from '@/shared/coord';
import EditToolbar from '@/components/EditToolbar';
import WorkUploadModal from '@/components/WorkUploadModal';
import CommentSection from '@/components/CommentSection';
import { Eye, Edit3, Users, Image, RotateCw, Trash2, Maximize2 } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ col: number; row: number } | null>(null);
  const isPointerLockedRef = useRef(false);
  const lastMouseMoveRef = useRef<{ x: number; y: number } | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const grid = useGalleryStore((s) => s.grid);
  const walls = useGalleryStore((s) => s.walls);
  const platforms = useGalleryStore((s) => s.platforms);
  const works = useGalleryStore((s) => s.works);
  const visitorCount = useGalleryStore((s) => s.visitorCount);
  const toolMode = useGalleryStore((s) => s.toolMode);
  const viewMode = useGalleryStore((s) => s.viewMode);
  const playerPos = useGalleryStore((s) => s.playerPos);
  const selectedCell = useGalleryStore((s) => s.selectedCell);
  const collisionFlash = useGalleryStore((s) => s.collisionFlash);
  const showWorkUpload = useGalleryStore((s) => s.showWorkUpload);
  const showWorkPreview = useGalleryStore((s) => s.showWorkPreview);
  const showContextMenu = useGalleryStore((s) => s.showContextMenu);
  const hoveredCell = useGalleryStore((s) => s.hoveredCell);

  const setViewMode = useGalleryStore((s) => s.setViewMode);
  const placeCell = useGalleryStore((s) => s.placeCell);
  const removeCell = useGalleryStore((s) => s.removeCell);
  const selectCell = useGalleryStore((s) => s.selectCell);
  const rotateWall = useGalleryStore((s) => s.rotateWall);
  const movePlayer = useGalleryStore((s) => s.movePlayer);
  const setPlayerAngle = useGalleryStore((s) => s.setPlayerAngle);
  const setCollisionFlash = useGalleryStore((s) => s.setCollisionFlash);
  const setShowWorkUpload = useGalleryStore((s) => s.setShowWorkUpload);
  const setShowWorkPreview = useGalleryStore((s) => s.setShowWorkPreview);
  const setShowContextMenu = useGalleryStore((s) => s.setShowContextMenu);
  const setHoveredCell = useGalleryStore((s) => s.setHoveredCell);
  const moveCell = useGalleryStore((s) => s.moveCell);
  const loadDemoData = useGalleryStore((s) => s.loadDemoData);

  useEffect(() => {
    loadDemoData();
  }, [loadDemoData]);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);

    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      setCanvasSize({ width: w, height: h });
      rendererRef.current?.resize(w, h);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    const container = canvasRef.current.parentElement;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.updateCollisionGrid(grid);
  }, [grid]);

  const renderFrame = useCallback(
    (timestamp: number) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (viewMode === 'roam') {
        const state = useGalleryStore.getState();
        let dx = 0;
        let dy = 0;
        const keys = keysRef.current;
        const speed = ROAM.moveSpeed * dt;
        const cos = Math.cos(state.playerPos.angle);
        const sin = Math.sin(state.playerPos.angle);

        if (keys.has('w') || keys.has('arrowup')) {
          dx += cos * speed;
          dy += sin * speed;
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          dx -= cos * speed;
          dy -= sin * speed;
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          dx += sin * speed;
          dy -= cos * speed;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          dx -= sin * speed;
          dy += cos * speed;
        }

        if (dx !== 0 || dy !== 0) {
          const collisionDetector = renderer.getCollisionDetector();
          const radius = ROAM.playerRadius;

          const newX = state.playerPos.x + dx;
          const colX = collisionDetector.checkPlayerCollision(newX, state.playerPos.y, radius);
          if (!colX.collided) {
            movePlayer(dx, 0);
          } else {
            setCollisionFlash(true);
          }

          const currentPos = useGalleryStore.getState().playerPos;
          const newY = currentPos.y + dy;
          const colY = collisionDetector.checkPlayerCollision(currentPos.x, newY, radius);
          if (!colY.collided) {
            movePlayer(0, dy);
          } else {
            setCollisionFlash(true);
          }
        }

        const currentState = useGalleryStore.getState();
        renderer.renderRoam({
          grid: currentState.grid,
          walls: currentState.walls,
          platforms: currentState.platforms,
          works: currentState.works,
          selectedCell: null,
          collisionFlash: currentState.collisionFlash,
          playerPos: currentState.playerPos,
          hoveredCell: null,
        });
      } else {
        const state = useGalleryStore.getState();
        renderer.renderEdit({
          grid: state.grid,
          walls: state.walls,
          platforms: state.platforms,
          works: state.works,
          selectedCell: state.selectedCell,
          collisionFlash: false,
          playerPos: state.playerPos,
          hoveredCell: state.hoveredCell,
        });
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    },
    [viewMode, movePlayer, setCollisionFlash]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderFrame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());

      if (viewMode === 'roam' && e.key === 'e') {
        const state = useGalleryStore.getState();
        const renderer = rendererRef.current;
        if (renderer) {
          const work = renderer.findWorkInSight(
            state.playerPos,
            state.grid,
            state.works
          );
          if (work) {
            setShowWorkPreview(work.id);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewMode, setShowWorkPreview]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (viewMode === 'roam') {
        if (e.button === 0) {
          canvasRef.current?.requestPointerLock();
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.button === 2) {
        const isMobile = window.innerWidth < 768;
        const cellSize = isMobile ? GRID.cellSize / 2 : GRID.cellSize;
        const cell = rendererRef.current?.hitTest(x, y, cellSize);
        if (cell && grid[cell.row]?.[cell.col] !== 'empty') {
          setShowContextMenu({ x: e.clientX, y: e.clientY, col: cell.col, row: cell.row });
        }
        return;
      }

      if (e.button === 0) {
        const isMobile = window.innerWidth < 768;
        const cellSize = isMobile ? GRID.cellSize / 2 : GRID.cellSize;
        const cell = rendererRef.current?.hitTest(x, y, cellSize);
        if (!cell) return;

        if (toolMode === 'brush') {
          placeCell(cell.col, cell.row);
        } else if (toolMode === 'eraser') {
          removeCell(cell.col, cell.row);
        } else if (toolMode === 'select') {
          selectCell(cell);
          isDraggingRef.current = true;
          dragStartRef.current = cell;
        }
      }
    },
    [viewMode, toolMode, grid, placeCell, removeCell, selectCell, setShowContextMenu]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (viewMode === 'roam') {
        if (document.pointerLockElement === canvasRef.current) {
          const state = useGalleryStore.getState();
          const dAngle = e.movementX * ROAM.rotationSpeed;
          setPlayerAngle(state.playerPos.angle + dAngle);
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isMobile = window.innerWidth < 768;
      const cellSize = isMobile ? GRID.cellSize / 2 : GRID.cellSize;
      const cell = rendererRef.current?.hitTest(x, y, cellSize);
      setHoveredCell(cell ?? null);

      if (isDraggingRef.current && dragStartRef.current && cell) {
        if (toolMode === 'select') {
          lastMouseMoveRef.current = { x: cell.col, y: cell.row };
        }
      }
    },
    [viewMode, toolMode, setHoveredCell, setPlayerAngle]
  );

  const handleCanvasMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (viewMode === 'roam') return;

      if (isDraggingRef.current && dragStartRef.current && lastMouseMoveRef.current) {
        const from = dragStartRef.current;
        const to = lastMouseMoveRef.current;
        if (from.col !== to.x || from.row !== to.y) {
          moveCell(from.col, from.row, to.x, to.y);
        }
      }

      isDraggingRef.current = false;
      dragStartRef.current = null;
      lastMouseMoveRef.current = null;
    },
    [viewMode, moveCell]
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (viewMode !== 'edit') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isMobile = window.innerWidth < 768;
      const cellSize = isMobile ? GRID.cellSize / 2 : GRID.cellSize;
      const cell = rendererRef.current?.hitTest(x, y, cellSize);
      if (!cell) return;

      if (grid[cell.row]?.[cell.col] === 'wall') {
        const wallKey = getCellKey(cell.col, cell.row);
        const existingWork = works.find((w) => w.wallId === wallKey);
        if (existingWork) {
          setShowWorkPreview(existingWork.id);
        } else {
          setShowWorkUpload(wallKey);
        }
      }
    },
    [viewMode, grid, works, setShowWorkUpload, setShowWorkPreview]
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (viewMode === 'roam') {
        const renderer = rendererRef.current;
        if (!renderer) return;
        const state = useGalleryStore.getState();
        const work = renderer.findWorkInSight(
          state.playerPos,
          state.grid,
          state.works
        );
        if (work) {
          setShowWorkPreview(work.id);
        }
      }
    },
    [viewMode, setShowWorkPreview]
  );

  const handleToggleMode = useCallback(() => {
    if (viewMode === 'edit') {
      const state = useGalleryStore.getState();
      const renderer = rendererRef.current;
      if (renderer) {
        const emptyCell = renderer.getCollisionDetector().findEmptyCell();
        if (emptyCell) {
          useGalleryStore.setState({
            playerPos: {
              x: emptyCell.col + 0.5,
              y: emptyCell.row + 0.5,
              angle: 0,
            },
          });
        }
      }
      setViewMode('roam');
    } else {
      document.exitPointerLock?.();
      setViewMode('edit');
    }
  }, [viewMode, setViewMode]);

  const handleContextAction = useCallback(
    (action: 'delete' | 'rotate') => {
      if (!showContextMenu) return;
      if (action === 'delete') {
        removeCell(showContextMenu.col, showContextMenu.row);
      } else if (action === 'rotate') {
        rotateWall(showContextMenu.col, showContextMenu.row);
      }
      setShowContextMenu(null);
    },
    [showContextMenu, removeCell, rotateWall, setShowContextMenu]
  );

  const workCount = works.length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="visitor-counter">
            <Users size={14} />
            <span>{visitorCount}</span>
          </div>
          <div className="work-counter">
            <Image size={14} />
            <span>{workCount}</span>
          </div>
        </div>

        <div className="header-center">
          <h1 className="app-title">🌌 虚拟画廊</h1>
        </div>

        <div className="header-right">
          <button
            className="mode-toggle-btn"
            onClick={handleToggleMode}
          >
            {viewMode === 'edit' ? (
              <>
                <Eye size={16} />
                <span>漫游模式</span>
              </>
            ) : (
              <>
                <Edit3 size={16} />
                <span>编辑模式</span>
              </>
            )}
          </button>
        </div>
      </header>

      {viewMode === 'edit' && <EditToolbar />}

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleCanvasContextMenu}
          onClick={handleCanvasClick}
          style={{ cursor: viewMode === 'roam' ? 'crosshair' : 'default' }}
        />

        {viewMode === 'roam' && (
          <div className="roam-hint">
            WASD移动 · 鼠标旋转 · E/点击查看作品
          </div>
        )}

        {viewMode === 'edit' && (
          <div className="edit-hint">
            左键放置 · 右键菜单 · 双击展墙上传作品
          </div>
        )}
      </div>

      {showContextMenu && (
        <div
          className="context-menu"
          style={{ left: showContextMenu.x, top: showContextMenu.y }}
        >
          <button onClick={() => handleContextAction('rotate')}>
            <RotateCw size={14} />
            旋转
          </button>
          <button onClick={() => handleContextAction('delete')}>
            <Trash2 size={14} />
            删除
          </button>
        </div>
      )}

      <WorkUploadModal />
      <CommentSection />

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: ${COLORS.background};
          color: ${COLORS.text};
          overflow: hidden;
        }

        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: ${COLORS.cardBg};
          border-bottom: 1px solid ${COLORS.modalBorder};
          flex-shrink: 0;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .visitor-counter {
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${COLORS.visitorCount};
          font-size: 14px;
          font-weight: 600;
        }

        .work-counter {
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${COLORS.text};
          font-size: 14px;
        }

        .header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .app-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .mode-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: ${COLORS.warning};
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .mode-toggle-btn:hover {
          background: ${COLORS.warningHover};
          transform: translateY(-2px);
        }

        .canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .canvas-container canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .roam-hint,
        .edit-hint {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 16px;
          background: rgba(0, 0, 0, 0.6);
          color: ${COLORS.textSecondary};
          font-size: 12px;
          border-radius: 20px;
          pointer-events: none;
          white-space: nowrap;
        }

        .context-menu {
          position: fixed;
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.modalBorder};
          border-radius: 8px;
          padding: 4px;
          z-index: 500;
          min-width: 120px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .context-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          color: ${COLORS.text};
          font-size: 13px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s;
        }

        .context-menu button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 768px) {
          .header-center {
            position: static;
            transform: none;
          }
          .app-title {
            font-size: 14px;
          }
          .mode-toggle-btn span {
            display: none;
          }
          .mode-toggle-btn {
            padding: 8px 10px;
          }
          .edit-hint {
            bottom: 68px;
          }
        }
      `}</style>
    </div>
  );
}
