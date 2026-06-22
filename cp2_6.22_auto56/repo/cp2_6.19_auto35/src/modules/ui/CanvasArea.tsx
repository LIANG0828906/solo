import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { LayoutEngine } from '../layout/LayoutEngine';
import type { Wall, ResizeCorner, Point, ArtworkOnWall } from '../layout/types';

type InteractionMode =
  | 'none'
  | 'panning'
  | 'wall-dragging'
  | 'wall-resizing'
  | 'wall-rotating';

const CanvasArea: React.FC = () => {
  const {
    walls,
    artworks,
    viewport,
    selectedWallId,
    setViewport,
    setSelectedWallId,
    addWall,
    updateWall,
    addArtworkToWall,
    openDetailModal,
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const layoutEngine = useRef(new LayoutEngine());

  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [dragStartScreen, setDragStartScreen] = useState<Point>({ x: 0, y: 0 });
  const [dragStartWorld, setDragStartWorld] = useState<Point>({ x: 0, y: 0 });
  const [viewportStart, setViewportStart] = useState({ offsetX: 0, offsetY: 0 });
  const [wallStart, setWallStart] = useState<Wall | null>(null);
  const [resizeCorner, setResizeCorner] = useState<ResizeCorner | null>(null);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [snapTarget, setSnapTarget] = useState<{ wallId: string; point: Point; positionOnWall: number } | null>(null);

  useEffect(() => {
    layoutEngine.current.setWalls(walls);
    layoutEngine.current.setArtworks(artworks);
  }, [walls, artworks]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - viewport.offsetX) / viewport.scale;
      const y = (screenY - rect.top - viewport.offsetY) / viewport.scale;
      return { x, y };
    },
    [viewport]
  );

  const isCanvasTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement) && !(target instanceof SVGElement)) return false;
    const el = target as Element;
    if (el === canvasRef.current) return true;
    if (el.closest('.canvas-container') && !el.closest('.wall-group') && !el.closest('.artwork-on-wall')) {
      return true;
    }
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const target = e.target as Element;
    if (!target.closest('.wall-group') && !target.closest('.artwork-on-wall')) {
      setInteractionMode('panning');
      setDragStartScreen({ x: e.clientX, y: e.clientY });
      setViewportStart({ offsetX: viewport.offsetX, offsetY: viewport.offsetY });
      setSelectedWallId(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleWallMouseDown = (e: React.MouseEvent, wall: Wall) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setSelectedWallId(wall.id);
    setInteractionMode('wall-dragging');
    setDragStartWorld(screenToWorld(e.clientX, e.clientY));
    setWallStart({ ...wall });
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, corner: ResizeCorner, wall: Wall) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setSelectedWallId(wall.id);
    setInteractionMode('wall-resizing');
    setResizeCorner(corner);
    setDragStartScreen({ x: e.clientX, y: e.clientY });
    setWallStart({ ...wall });
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleRotateMouseDown = (e: React.MouseEvent, wall: Wall) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    if (!canvasRef.current) return;

    setSelectedWallId(wall.id);
    setInteractionMode('wall-rotating');
    setWallStart({ ...wall });

    const rect = canvasRef.current.getBoundingClientRect();
    const wallScreenX = wall.x * viewport.scale + viewport.offsetX;
    const wallScreenY = wall.y * viewport.scale + viewport.offsetY;

    setRotationStartAngle(
      Math.atan2(e.clientY - rect.top - wallScreenY, e.clientX - rect.left - wallScreenX) - wall.rotation
    );

    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (interactionMode === 'panning') {
        const dx = e.clientX - dragStartScreen.x;
        const dy = e.clientY - dragStartScreen.y;
        setViewport({
          offsetX: viewportStart.offsetX + dx,
          offsetY: viewportStart.offsetY + dy,
          scale: viewport.scale,
        });
      } else if (interactionMode === 'wall-dragging' && wallStart) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const dx = worldPos.x - dragStartWorld.x;
        const dy = worldPos.y - dragStartWorld.y;

        const updatedWall = layoutEngine.current.moveWall(
          wallStart.id,
          wallStart.x + dx,
          wallStart.y + dy
        );
        if (updatedWall) {
          updateWall(updatedWall);
        }
      } else if (interactionMode === 'wall-resizing' && wallStart && resizeCorner) {
        const dx = (e.clientX - dragStartScreen.x) / viewport.scale;
        const dy = (e.clientY - dragStartScreen.y) / viewport.scale;

        layoutEngine.current.setWalls(
          walls.map((w) => (w.id === wallStart.id ? { ...wallStart } : w))
        );

        const updatedWall = layoutEngine.current.resizeWall(wallStart.id, resizeCorner, dx, dy);
        if (updatedWall) {
          updateWall(updatedWall);
        }
      } else if (interactionMode === 'wall-rotating' && wallStart && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const wallScreenX = wallStart.x * viewport.scale + viewport.offsetX;
        const wallScreenY = wallStart.y * viewport.scale + viewport.offsetY;

        const currentAngle = Math.atan2(
          e.clientY - rect.top - wallScreenY,
          e.clientX - rect.left - wallScreenX
        );

        const updatedWall = layoutEngine.current.rotateWall(
          wallStart.id,
          currentAngle - rotationStartAngle
        );
        if (updatedWall) {
          updateWall(updatedWall);
        }
      }
    },
    [
      interactionMode,
      dragStartScreen,
      dragStartWorld,
      viewportStart,
      viewport,
      wallStart,
      resizeCorner,
      rotationStartAngle,
      screenToWorld,
      updateWall,
      walls,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (interactionMode !== 'none') {
      setInteractionMode('none');
      setWallStart(null);
      setResizeCorner(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  }, [interactionMode]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(3.0, viewport.scale * zoomFactor));

    const worldX = (mouseX - viewport.offsetX) / viewport.scale;
    const worldY = (mouseY - viewport.offsetY) / viewport.scale;

    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;

    setViewport({
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      scale: newScale,
    });
  };

  const handleAddRectWall = () => {
    const centerX = (-viewport.offsetX + 300) / viewport.scale;
    const centerY = (-viewport.offsetY + 200) / viewport.scale;
    const wall = layoutEngine.current.addWall('rectangle', centerX, centerY, 300, 60);
    addWall(wall);
    setSelectedWallId(wall.id);
  };

  const handleAddLShapeWall = () => {
    const centerX = (-viewport.offsetX + 300) / viewport.scale;
    const centerY = (-viewport.offsetY + 200) / viewport.scale;
    const wall = layoutEngine.current.addWall('rectangle', centerX, centerY, 350, 200);
    addWall(wall);
    setSelectedWallId(wall.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const worldPos = screenToWorld(e.clientX, e.clientY);

    let closestWall: Wall | null = null;
    let closestDistance = Infinity;
    let closestPoint: Point | null = null;
    let closestPosition = 0;

    for (const wall of walls) {
      const result = layoutEngine.current.getClosestPointOnWall(worldPos.x, worldPos.y, wall);
      if (result.distance < closestDistance && result.distance < 80) {
        closestDistance = result.distance;
        closestWall = wall;
        closestPoint = result.point;
        closestPosition = result.positionOnWall;
      }
    }

    if (closestWall && closestPoint) {
      setSnapTarget({ wallId: closestWall.id, point: closestPoint, positionOnWall: closestPosition });
    } else {
      setSnapTarget(null);
    }
  };

  const handleDragLeave = () => {
    setSnapTarget(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const artworkId = e.dataTransfer.getData('artworkId');
    if (!artworkId) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);

    let closestWall: Wall | null = null;
    let closestDistance = Infinity;
    let closestPosition = 0;

    for (const wall of walls) {
      const result = layoutEngine.current.getClosestPointOnWall(worldPos.x, worldPos.y, wall);
      if (result.distance < closestDistance && result.distance < 80) {
        closestDistance = result.distance;
        closestWall = wall;
        closestPosition = result.positionOnWall;
      }
    }

    if (closestWall) {
      addArtworkToWall(closestWall.id, artworkId, closestPosition);
    }

    setSnapTarget(null);
  };

  const handleArtworkClick = (e: React.MouseEvent, artworkId: string) => {
    e.stopPropagation();
    openDetailModal(artworkId);
  };

  const getArtworkDisplaySize = (artworkId: string) => {
    const artwork = artworks.find((a) => a.id === artworkId);
    if (!artwork) return { width: 40, height: 40 };

    const maxWidth = 50;
    const maxHeight = 50;
    const ratio = Math.min(maxWidth / artwork.width, maxHeight / artwork.height);

    return {
      width: artwork.width * ratio,
      height: artwork.height * ratio,
    };
  };

  const getArtworkPosition = (wall: Wall, aow: ArtworkOnWall): Point => {
    const size = getArtworkDisplaySize(aow.artworkId);
    const hw = wall.width / 2;
    const offsetX = -hw + wall.width * aow.positionOnWall;

    const cos = Math.cos(wall.rotation);
    const sin = Math.sin(wall.rotation);

    return {
      x: wall.x + offsetX * cos - (-wall.height / 2 + size.height / 2 + 5) * sin,
      y: wall.y + offsetX * sin + (-wall.height / 2 + size.height / 2 + 5) * cos,
    };
  };

  const gridLines = useMemo(() => {
    const gridSize = 50;
    const lines: React.ReactNode[] = [];

    const startX = Math.floor(-viewport.offsetX / viewport.scale / gridSize) * gridSize;
    const startY = Math.floor(-viewport.offsetY / viewport.scale / gridSize) * gridSize;

    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 800;

    const endX = startX + canvasWidth / viewport.scale + gridSize * 2;
    const endY = startY + canvasHeight / viewport.scale + gridSize * 2;

    let lineIndex = 0;
    for (let x = startX; x < endX; x += gridSize) {
      lines.push(
        <line
          key={`grid-v-${lineIndex++}`}
          x1={x}
          y1={startY}
          x2={x}
          y2={endY}
          stroke="#3A3A3A"
          strokeWidth="0.5"
        />
      );
    }

    for (let y = startY; y < endY; y += gridSize) {
      lines.push(
        <line
          key={`grid-h-${lineIndex++}`}
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke="#3A3A3A"
          strokeWidth="0.5"
        />
      );
    }

    return lines;
  }, [viewport.offsetX, viewport.offsetY, viewport.scale]);

  const selectedWall = walls.find((w) => w.id === selectedWallId);
  const showGuides = interactionMode === 'wall-dragging' || interactionMode === 'wall-resizing' || interactionMode === 'wall-rotating';

  return (
    <div className="canvas-area">
      <div className="canvas-toolbar">
        <button className="toolbar-button" onClick={handleAddRectWall}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <span>矩形展墙</span>
        </button>
        <button className="toolbar-button" onClick={handleAddLShapeWall}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h8v18H3zM11 13h10v8H11z" />
          </svg>
          <span>L型展墙</span>
        </button>
        <div className="toolbar-separator" />
        <div className="zoom-info">
          <span>{Math.round(viewport.scale * 100)}%</span>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="canvas-container"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className="canvas-grid"
          style={{
            transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {gridLines}

          {walls.map((wall) => {
            const isSelected = wall.id === selectedWallId;
            const corners = layoutEngine.current.getWallCorners(wall);
            const pointsStr = corners.map((c) => `${c.x},${c.y}`).join(' ');

            return (
              <g
                key={`wall-${wall.id}`}
                className="wall-group"
                onMouseDown={(e) => handleWallMouseDown(e, wall)}
                style={{ cursor: interactionMode === 'none' ? 'grab' : undefined }}
              >
                <polygon
                  points={pointsStr}
                  fill="#C8C8C8"
                  stroke={isSelected ? '#4A90D9' : '#888'}
                  strokeWidth={isSelected ? 2 : 1}
                  className={isSelected ? 'wall-selected' : ''}
                />

                {showGuides && isSelected && (
                  <g key={`guides-${wall.id}`} className="wall-guides">
                    <line
                      key={`guide-v-${wall.id}`}
                      x1={wall.x}
                      y1={wall.y - wall.height / 2 - 20}
                      x2={wall.x}
                      y2={wall.y + wall.height / 2 + 20}
                      stroke="#4A90D9"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      opacity="0.6"
                      transform={`rotate(${(wall.rotation * 180) / Math.PI}, ${wall.x}, ${wall.y})`}
                    />
                    <line
                      key={`guide-h-${wall.id}`}
                      x1={wall.x - wall.width / 2 - 20}
                      y1={wall.y}
                      x2={wall.x + wall.width / 2 + 20}
                      y2={wall.y}
                      stroke="#4A90D9"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      opacity="0.6"
                      transform={`rotate(${(wall.rotation * 180) / Math.PI}, ${wall.x}, ${wall.y})`}
                    />
                  </g>
                )}

                {wall.artworks.map((aow) => {
                  const artwork = artworks.find((a) => a.id === aow.artworkId);
                  if (!artwork) return null;

                  const size = getArtworkDisplaySize(aow.artworkId);
                  const pos = getArtworkPosition(wall, aow);
                  const rotationDeg = (wall.rotation * 180) / Math.PI;

                  return (
                    <g
                      key={`aow-${aow.id}`}
                      className="artwork-on-wall"
                      transform={`translate(${pos.x}, ${pos.y}) rotate(${rotationDeg})`}
                      onClick={(e) => handleArtworkClick(e, artwork.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={-size.width / 2}
                        y={-size.height / 2}
                        width={size.width}
                        height={size.height}
                        fill="rgba(255, 255, 255, 0.9)"
                        stroke="#999"
                        strokeWidth="1"
                        rx="2"
                      />
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#333"
                        style={{ pointerEvents: 'none' }}
                      >
                        {artwork.name.length > 4 ? artwork.name.substring(0, 4) + '…' : artwork.name}
                      </text>
                    </g>
                  );
                })}

                {isSelected && (
                  <g key={`handles-${wall.id}`} className="wall-handles">
                    {(['nw', 'ne', 'sw', 'se'] as ResizeCorner[]).map((corner) => {
                      const hw = wall.width / 2;
                      const hh = wall.height / 2;
                      let lx = 0;
                      let ly = 0;
                      if (corner === 'nw') {
                        lx = -hw;
                        ly = -hh;
                      } else if (corner === 'ne') {
                        lx = hw;
                        ly = -hh;
                      } else if (corner === 'sw') {
                        lx = -hw;
                        ly = hh;
                      } else if (corner === 'se') {
                        lx = hw;
                        ly = hh;
                      }

                      const cos = Math.cos(wall.rotation);
                      const sin = Math.sin(wall.rotation);
                      const wx = wall.x + lx * cos - ly * sin;
                      const wy = wall.y + lx * sin + ly * cos;

                      return (
                        <rect
                          key={`handle-${wall.id}-${corner}`}
                          x={wx - 5}
                          y={wy - 5}
                          width={10}
                          height={10}
                          fill="#fff"
                          stroke="#4A90D9"
                          strokeWidth="2"
                          className="resize-handle"
                          style={{ cursor: `${corner}-resize` }}
                          onMouseDown={(e) => handleResizeMouseDown(e, corner, wall)}
                        />
                      );
                    })}

                    <g
                      key={`rotate-${wall.id}`}
                      className="rotate-handle-group"
                      onMouseDown={(e) => handleRotateMouseDown(e, wall)}
                      style={{ cursor: 'grab' }}
                    >
                      <line
                        key={`rotate-line-${wall.id}`}
                        x1={wall.x}
                        y1={wall.y - wall.height / 2}
                        x2={wall.x}
                        y2={wall.y - wall.height / 2 - 20}
                        stroke="#4A90D9"
                        strokeWidth="1"
                        transform={`rotate(${(wall.rotation * 180) / Math.PI}, ${wall.x}, ${wall.y - wall.height / 2 - 10})`}
                      />
                      <rect
                        key={`rotate-rect-${wall.id}`}
                        x={wall.x - 5}
                        y={wall.y - wall.height / 2 - 25}
                        width={10}
                        height={10}
                        fill="#fff"
                        stroke="#4A90D9"
                        strokeWidth="2"
                        className="rotate-handle"
                        transform={`rotate(${(wall.rotation * 180) / Math.PI}, ${wall.x}, ${wall.y - wall.height / 2 - 20})`}
                      />
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {snapTarget && (
            <g className="snap-indicator-group">
              <circle
                cx={snapTarget.point.x}
                cy={snapTarget.point.y}
                r="10"
                fill="none"
                stroke="#4A90D9"
                strokeWidth="2"
                className="snap-indicator"
              />
              <circle
                cx={snapTarget.point.x}
                cy={snapTarget.point.y}
                r="4"
                fill="#4A90D9"
              />
            </g>
          )}
        </svg>

        <div className="canvas-hint">
          <span>拖拽展品到展墙上 • 滚轮缩放 • 空白处拖拽平移</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
