import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Wall, Artwork, WallResizeCorner, DragState } from '../layout/types';

interface CanvasAreaProps {
  draggingArtwork: Artwork | null;
  onDragEnd: (didPlace: boolean) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  draggingArtwork,
  onDragEnd,
}) => {
  const {
    walls,
    artworks,
    viewport,
    selectedWallId,
    layoutEngine,
    setViewport,
    selectWall,
    selectArtwork,
    moveWall,
    resizeWall,
    rotateWall,
    adhereArtwork,
    openDetailModal,
    addWall,
    removeWall,
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    type: null,
    targetId: null,
    startX: 0,
    startY: 0,
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState(false);
  const [nearestSnap, setNearestSnap] = useState<{
    wallId: string;
    position: number;
    x: number;
    y: number;
  } | null>(null);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - viewport.offsetX) / viewport.scale;
      const y = (screenY - rect.top - viewport.offsetY) / viewport.scale;
      return { x, y };
    },
    [viewport]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(3, viewport.scale * zoomFactor));

      const scaleChange = newScale / viewport.scale;
      const newOffsetX = mouseX - (mouseX - viewport.offsetX) * scaleChange;
      const newOffsetY = mouseY - (mouseY - viewport.offsetY) * scaleChange;

      setViewport({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [viewport, setViewport]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const wall = layoutEngine.findWallAtPoint(worldPos.x, worldPos.y);

    if (wall) {
      selectWall(wall.id);
      setDragState({
        isDragging: true,
        type: 'wall',
        targetId: wall.id,
        startX: e.clientX,
        startY: e.clientY,
        startWallX: wall.x,
        startWallY: wall.y,
      });
      setShowGuides(true);
    } else {
      selectWall(null);
      selectArtwork(null);
      setDragState({
        isDragging: true,
        type: 'canvas',
        targetId: null,
        startX: e.clientX,
        startY: e.clientY,
        startWallX: viewport.offsetX,
        startWallY: viewport.offsetY,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (draggingArtwork) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        const snap = layoutEngine.findNearestSnapPoint(
          worldPos.x,
          worldPos.y,
          30 / viewport.scale
        );
        if (snap) {
          const wall = layoutEngine.getWallById(snap.wallId);
          if (wall) {
            const points = layoutEngine.getSnapPoints(snap.wallId);
            const point = points.find((_, i) => Math.abs((i + 1) / 6 - snap.position) < 0.1) || points[0];
            setNearestSnap({
              wallId: snap.wallId,
              position: snap.position,
              x: point.x,
              y: point.y,
            });
          }
        } else {
          setNearestSnap(null);
        }
        return;
      }

      if (!dragState.isDragging) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'canvas') {
        const newOffsetX = (dragState.startWallX || 0) + dx;
        const newOffsetY = (dragState.startWallY || 0) + dy;
        setViewport({
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      } else if (dragState.type === 'wall' && dragState.targetId) {
        const wallDx = dx / viewport.scale;
        const wallDy = dy / viewport.scale;
        moveWall(
          dragState.targetId,
          (dragState.startWallX || 0) + wallDx,
          (dragState.startWallY || 0) + wallDy
        );
      } else if (dragState.type === 'wall-resize' && dragState.targetId) {
        resizeWall(
          dragState.targetId,
          dragState.corner as WallResizeCorner,
          dx / viewport.scale,
          dy / viewport.scale
        );
      } else if (dragState.type === 'wall-rotate' && dragState.targetId) {
        const wall = layoutEngine.getWallById(dragState.targetId);
        if (wall) {
          const center = layoutEngine.getWallCenter(wall);
          const worldPos = screenToWorld(e.clientX, e.clientY);
          const angle =
            Math.atan2(worldPos.y - center.y, worldPos.x - center.x) *
            (180 / Math.PI);
          rotateWall(dragState.targetId, angle + 90);
        }
      }
    },
    [
      dragState,
      viewport.scale,
      draggingArtwork,
      screenToWorld,
      layoutEngine,
      setViewport,
      moveWall,
      resizeWall,
      rotateWall,
    ]
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (draggingArtwork && nearestSnap) {
        adhereArtwork(nearestSnap.wallId, draggingArtwork.id, nearestSnap.position);
        onDragEnd(true);
      } else if (draggingArtwork) {
        onDragEnd(false);
      }

      setDragState({
        isDragging: false,
        type: null,
        targetId: null,
        startX: 0,
        startY: 0,
      });
      setShowGuides(false);
      setNearestSnap(null);
    },
    [draggingArtwork, nearestSnap, adhereArtwork, onDragEnd]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    wallId: string,
    corner: WallResizeCorner
  ) => {
    e.stopPropagation();
    const wall = layoutEngine.getWallById(wallId);
    if (!wall) return;

    setDragState({
      isDragging: true,
      type: 'wall-resize',
      targetId: wallId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: wall.width,
      startHeight: wall.height,
      corner,
    });
    setShowGuides(true);
  };

  const handleRotateHandleMouseDown = (e: React.MouseEvent, wallId: string) => {
    e.stopPropagation();
    const wall = layoutEngine.getWallById(wallId);
    if (!wall) return;

    setDragState({
      isDragging: true,
      type: 'wall-rotate',
      targetId: wallId,
      startX: e.clientX,
      startY: e.clientY,
      startRotation: wall.rotation,
    });
    setShowGuides(true);
  };

  const handleArtworkClick = (e: React.MouseEvent, artworkId: string) => {
    e.stopPropagation();
    openDetailModal(artworkId);
  };

  const handleAddWall = () => {
    const worldPos = screenToWorld(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    addWall('rectangle', worldPos.x - 150, worldPos.y - 15, 300, 30);
  };

  const renderWall = (wall: Wall) => {
    const isSelected = selectedWallId === wall.id;
    void layoutEngine.getWallCenter(wall);

    return (
      <div
        key={wall.id}
        style={{
          position: 'absolute',
          left: wall.x,
          top: wall.y,
          width: wall.width,
          height: wall.height,
          backgroundColor: '#C8C8C8',
          border: isSelected ? '2px solid #4A90D9' : '1px solid #999',
          boxSizing: 'border-box',
          cursor: dragState.isDragging ? 'grabbing' : 'grab',
          transformOrigin: 'center center',
          transform: `rotate(${wall.rotation}deg)`,
          transition: dragState.isDragging ? 'none' : 'box-shadow 0.2s',
          boxShadow: isSelected
            ? '0 0 20px rgba(74, 144, 217, 0.5)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          selectWall(wall.id);
          setDragState({
            isDragging: true,
            type: 'wall',
            targetId: wall.id,
            startX: e.clientX,
            startY: e.clientY,
            startWallX: wall.x,
            startWallY: wall.y,
          });
          setShowGuides(true);
        }}
      >
        {isSelected && (
          <>
            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as WallResizeCorner[]).map(
              (corner) => (
                <div
                  key={corner}
                  onMouseDown={(e) =>
                    handleResizeHandleMouseDown(e, wall.id, corner)
                  }
                  style={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    backgroundColor: '#4A90D9',
                    border: '2px solid #fff',
                    borderRadius: 2,
                    cursor: `${corner}-resize`,
                    ...(corner.includes('top') ? { top: -6 } : { bottom: -6 }),
                    ...(corner.includes('left')
                      ? { left: -6 }
                      : { right: -6 }),
                    zIndex: 10,
                  }}
                />
              )
            )}
            <div
              onMouseDown={(e) => handleRotateHandleMouseDown(e, wall.id)}
              style={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 16,
                height: 16,
                backgroundColor: '#4A90D9',
                borderRadius: '50%',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 10,
                zIndex: 10,
              }}
            >
              ↻
            </div>
          </>
        )}

        {wall.artworks.map((artworkOnWall, _index) => {
          const artwork = artworks.find(
            (a) => a.id === artworkOnWall.artworkId
          );
          if (!artwork) return null;

          const pos = layoutEngine.getArtworkPositionOnWall(
            wall,
            artwork,
            artworkOnWall.positionOnWall
          );

          const relX = pos.x - wall.x;
          const relY = pos.y - wall.y;

          return (
            <div
              key={artwork.id}
              onClick={(e) => handleArtworkClick(e, artwork.id)}
              style={{
                position: 'absolute',
                left: relX,
                top: relY,
                width: artwork.width,
                height: artwork.height,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ddd',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                color: '#2A2A2A',
                textAlign: 'center',
                padding: 2,
                boxSizing: 'border-box',
                transform: `rotate(-${wall.rotation}deg) perspective(100px) rotateY(-15deg)`,
                transformOrigin: 'bottom center',
                transition: 'box-shadow 0.2s, transform 0.2s',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 15px rgba(74, 144, 217, 0.6)';
                e.currentTarget.style.border = '2px solid #4A90D9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.border = '1px solid #ddd';
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {artwork.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGrid = () => {
    const gridSize = 20;
    const lines = [];
    const worldWidth = 2000;
    const worldHeight = 2000;

    for (let x = -worldWidth; x <= worldWidth; x += gridSize) {
      lines.push(
        <div
          key={`v-${x}`}
          style={{
            position: 'absolute',
            left: x,
            top: -worldHeight,
            width: 1,
            height: worldHeight * 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          }}
        />
      );
    }
    for (let y = -worldHeight; y <= worldHeight; y += gridSize) {
      lines.push(
        <div
          key={`h-${y}`}
          style={{
            position: 'absolute',
            left: -worldWidth,
            top: y,
            width: worldWidth * 2,
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          }}
        />
      );
    }
    return lines;
  };

  const renderSnapPoints = () => {
    if (!draggingArtwork) return null;

    return walls.flatMap((wall) =>
      layoutEngine.getSnapPoints(wall.id).map((point, i) => (
        <div
          key={`${wall.id}-snap-${i}`}
          style={{
            position: 'absolute',
            left: point.x - 6,
            top: point.y - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'rgba(74, 144, 217, 0.3)',
            border: '2px solid #4A90D9',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      ))
    );
  };

  const renderNearestSnapHighlight = () => {
    if (!nearestSnap || !draggingArtwork) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: nearestSnap.x - 10,
          top: nearestSnap.y - 10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'rgba(74, 144, 217, 0.5)',
          border: '3px solid #4A90D9',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 6,
          animation: 'pulse 1s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(74, 144, 217, 0.8)',
        }}
      />
    );
  };

  const renderDraggingArtwork = () => {
    if (!draggingArtwork) return null;

    const worldPos = screenToWorld(mousePos.x, mousePos.y);

    return (
      <div
        style={{
          position: 'absolute',
          left: worldPos.x - draggingArtwork.width / 2,
          top: worldPos.y - draggingArtwork.height / 2,
          width: draggingArtwork.width,
          height: draggingArtwork.height,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          border: '2px dashed #4A90D9',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#2A2A2A',
        }}
      >
        {draggingArtwork.name}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#2A2A2A',
        overflow: 'hidden',
        cursor: dragState.type === 'canvas' ? 'grabbing' : 'default',
      }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {renderGrid()}

        {showGuides && selectedWallId && (
          <>
            {(() => {
              const wall = layoutEngine.getWallById(selectedWallId);
              if (!wall) return null;
              const center = layoutEngine.getWallCenter(wall);
              return (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: center.x - 50,
                      top: center.y - 1,
                      width: 100,
                      height: 2,
                      backgroundColor: 'rgba(74, 144, 217, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: center.x - 1,
                      top: center.y - 50,
                      width: 2,
                      height: 100,
                      backgroundColor: 'rgba(74, 144, 217, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              );
            })()}
          </>
        )}

        {walls.map(renderWall)}
        {renderSnapPoints()}
        {renderNearestSnapHighlight()}
        {renderDraggingArtwork()}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleAddWall}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4A90D9',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 217, 0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          + 添加展墙
        </button>
        {selectedWallId && (
          <button
            onClick={() => removeWall(selectedWallId)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3A3A3A',
              color: '#E0E0E0',
              border: '1px solid #555',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            删除展墙
          </button>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: '#888',
          fontSize: 11,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '6px 10px',
          borderRadius: 4,
        }}
      >
        缩放: {Math.round(viewport.scale * 100)}%
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};
