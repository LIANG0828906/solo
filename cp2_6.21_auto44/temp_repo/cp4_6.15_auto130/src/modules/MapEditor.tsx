import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  TILE_DEFS,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  type TileDef,
  type TileCategory,
  type PlacedTile,
  type CollisionRect,
  type NPCData,
} from '../data/sampleMap';

interface MapEditorProps {
  tiles: PlacedTile[];
  collisions: CollisionRect[];
  npcs: NPCData[];
  selectedObject: { type: 'tile' | 'npc'; x: number; y: number } | null;
  isPlaying: boolean;
  playerPos: { x: number; y: number };
  playerMoving: boolean;
  playerDirection: 'up' | 'down' | 'left' | 'right';
  blockedCells: Set<string>;
  onTilePlace: (tile: PlacedTile) => void;
  onTilesBulkPlace: (tiles: PlacedTile[]) => void;
  onTileRemove: (x: number, y: number) => void;
  onCollisionAdd: (rect: CollisionRect) => void;
  onNpcAdd: (npc: NPCData) => void;
  onNpcUpdate: (id: string, updates: Partial<NPCData>) => void;
  onSelectObject: (obj: { type: 'tile' | 'npc'; x: number; y: number } | null) => void;
  onCanvasClick: (gridX: number, gridY: number, event: React.MouseEvent) => void;
  onPlayerClickNpc: (npcId: string) => void;
}

const CATEGORY_LABELS: Record<TileCategory, string> = {
  ground: '地面',
  wall: '墙壁',
  decoration: '装饰',
  npc: 'NPC',
};

const CATEGORY_ICONS: Record<TileCategory, string> = {
  ground: '🟩',
  wall: '🧱',
  decoration: '🌳',
  npc: '👤',
};

const DIRECTION_ROTATION: Record<string, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export const MapEditor: React.FC<MapEditorProps> = ({
  tiles,
  collisions,
  npcs,
  selectedObject,
  isPlaying,
  playerPos,
  playerMoving,
  playerDirection,
  blockedCells,
  onTilePlace,
  onTilesBulkPlace,
  onTileRemove,
  onCollisionAdd,
  onNpcAdd,
  onSelectObject,
  onCanvasClick,
  onPlayerClickNpc,
}) => {
  const [activeCategory, setActiveCategory] = useState<TileCategory>('ground');
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [draggingTile, setDraggingTile] = useState<TileDef | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [panelPinned, setPanelPinned] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectEnd, setRectEnd] = useState<{ x: number; y: number } | null>(null);
  const [shiftPressed, setShiftPressed] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const canvasWidth = GRID_WIDTH * CELL_SIZE;
  const canvasHeight = GRID_HEIGHT * CELL_SIZE;

  const filteredTiles = useMemo(
    () => TILE_DEFS.filter((t) => t.category === activeCategory),
    [activeCategory]
  );

  const tileMap = useMemo(() => {
    const map = new Map<string, PlacedTile>();
    tiles.forEach((t) => map.set(`${t.x},${t.y}`, t));
    return map;
  }, [tiles]);

  const npcMap = useMemo(() => {
    const map = new Map<string, NPCData>();
    npcs.forEach((n) => map.set(`${n.x},${n.y}`, n));
    return map;
  }, [npcs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
        setRectStart(null);
        setRectEnd(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getGridFromEvent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((clientY - rect.top) / CELL_SIZE);
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return null;
      return { x, y };
    },
    []
  );

  const handleAssetDragStart = (tile: TileDef, e: React.DragEvent) => {
    if (isPlaying) return;
    setDraggingTile(tile);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', tile.id);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (!draggingTile || isPlaying) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const pos = getGridFromEvent(e.clientX, e.clientY);
    if (pos) setHoverCell(pos);
  };

  const handleCanvasDragLeave = () => {
    setHoverCell(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    if (!draggingTile || isPlaying) return;
    e.preventDefault();
    const pos = getGridFromEvent(e.clientX, e.clientY);
    if (!pos) return;

    if (draggingTile.category === 'npc') {
      const existingNpc = npcs.find((n) => n.x === pos.x && n.y === pos.y);
      if (!existingNpc) {
        onNpcAdd({
          id: `npc_${Date.now()}`,
          x: pos.x,
          y: pos.y,
          direction: 'down',
          dialog: '你好，冒险者！',
        });
      }
    } else if (draggingTile.category === 'wall') {
      onTilePlace({ tileId: draggingTile.id, x: pos.x, y: pos.y });
      onCollisionAdd({ x: pos.x, y: pos.y, width: 1, height: 1 });
    } else {
      onTilePlace({ tileId: draggingTile.id, x: pos.x, y: pos.y });
    }

    setDraggingTile(null);
    setHoverCell(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPlaying) return;
    const pos = getGridFromEvent(e.clientX, e.clientY);

    if (draggingTile) {
      setDragPos({ x: e.clientX, y: e.clientY });
    }

    if (shiftPressed && rectStart && pos && draggingTile?.category === 'ground') {
      setRectEnd(pos);
    }

    setHoverCell(pos);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    if (e.button !== 0) return;
    const pos = getGridFromEvent(e.clientX, e.clientY);
    if (!pos) return;

    if (shiftPressed) {
      setRectStart(pos);
      setRectEnd(pos);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isPlaying) return;
    if (shiftPressed && rectStart && rectEnd && draggingTile?.category === 'ground') {
      const minX = Math.min(rectStart.x, rectEnd.x);
      const maxX = Math.max(rectStart.x, rectEnd.x);
      const minY = Math.min(rectStart.y, rectEnd.y);
      const maxY = Math.max(rectStart.y, rectEnd.y);

      const bulkTiles: PlacedTile[] = [];
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          bulkTiles.push({ tileId: draggingTile.id, x, y });
        }
      }
      onTilesBulkPlace(bulkTiles);
    }
    setRectStart(null);
    setRectEnd(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getGridFromEvent(e.clientX, e.clientY);
    if (!pos) return;

    if (isPlaying) {
      const npc = npcMap.get(`${pos.x},${pos.y}`);
      if (npc) {
        onPlayerClickNpc(npc.id);
        return;
      }
    }

    if (!isPlaying && !shiftPressed) {
      const npc = npcMap.get(`${pos.x},${pos.y}`);
      if (npc) {
        onSelectObject({ type: 'npc', x: pos.x, y: pos.y });
        return;
      }
      const tile = tileMap.get(`${pos.x},${pos.y}`);
      if (tile) {
        onSelectObject({ type: 'tile', x: pos.x, y: pos.y });
      } else {
        onSelectObject(null);
      }
    }

    onCanvasClick(pos.x, pos.y, e);
  };

  const handleNpcClick = (npc: NPCData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onPlayerClickNpc(npc.id);
    } else {
      onSelectObject({ type: 'npc', x: npc.x, y: npc.y });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPlaying) return;
    const pos = getGridFromEvent(e.clientX, e.clientY);
    if (!pos) return;
    onTileRemove(pos.x, pos.y);
    onSelectObject(null);
  };

  const renderRectSelect = () => {
    if (!rectStart || !rectEnd) return null;
    const minX = Math.min(rectStart.x, rectEnd.x);
    const maxX = Math.max(rectStart.x, rectEnd.x);
    const minY = Math.min(rectStart.y, rectEnd.y);
    const maxY = Math.max(rectStart.y, rectEnd.y);
    return (
      <div
        className="rect-select"
        style={{
          left: minX * CELL_SIZE,
          top: minY * CELL_SIZE,
          width: (maxX - minX + 1) * CELL_SIZE,
          height: (maxY - minY + 1) * CELL_SIZE,
        }}
      />
    );
  };

  return (
    <>
      <div className={`asset-panel ${panelPinned ? 'pinned' : ''}`}>
        <div
          className="asset-panel-handle"
          onClick={() => setPanelPinned(!panelPinned)}
          title={panelPinned ? '取消固定' : '固定面板'}
        >
          {panelPinned ? '◀' : '▶'}
        </div>
        <div className="asset-panel-header">
          <div className="asset-panel-title">素材库</div>
          <div className="asset-panel-subtitle">拖拽图块到画布上放置</div>
        </div>
        <div className="asset-tabs">
          {(Object.keys(CATEGORY_LABELS) as TileCategory[]).map((cat) => (
            <button
              key={cat}
              className={`asset-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="asset-grid">
          {filteredTiles.map((tile) => (
            <div
              key={tile.id}
              className={`asset-card ${draggingTile?.id === tile.id ? 'dragging' : ''}`}
              draggable={!isPlaying}
              onDragStart={(e) => handleAssetDragStart(tile, e)}
              onDragEnd={() => {
                setDraggingTile(null);
                setDragPos(null);
              }}
              title={`${tile.name}${tile.walkable ? '' : ' (不可通行)'}`}
            >
              <span className="asset-emoji">{tile.emoji}</span>
              <span className="asset-name">{tile.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="canvas-wrapper">
        <div className={`canvas-container ${isPlaying ? 'playing' : ''}`}>
          <div
            ref={canvasRef}
            className="grid-canvas"
            style={{ width: canvasWidth, height: canvasHeight }}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            onContextMenu={handleContextMenu}
          >
            {Array.from({ length: GRID_HEIGHT }).map((_, y) =>
              Array.from({ length: GRID_WIDTH }).map((_, x) => {
                const isHover = hoverCell?.x === x && hoverCell?.y === y;
                const isBlocked = blockedCells.has(`${x},${y}`);
                return (
                  <div
                    key={`${x},${y}`}
                    className={`grid-cell ${isHover ? 'hover' : ''} ${isBlocked ? 'blocked-highlight' : ''}`}
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  />
                );
              })
            )}

            {tiles.map((t) => {
              const def = TILE_DEFS.find((d) => d.id === t.tileId);
              if (!def) return null;
              const isGround = def.category === 'ground';
              const isSelected =
                selectedObject?.type === 'tile' &&
                selectedObject.x === t.x &&
                selectedObject.y === t.y;
              return (
                <div
                  key={`tile-${t.x}-${t.y}`}
                  className={`tile ${isGround ? 'tile-ground' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: t.x * CELL_SIZE,
                    top: t.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: isGround ? def.color + '55' : 'transparent',
                  }}
                >
                  <span>{def.emoji}</span>
                </div>
              );
            })}

            {collisions.map((c, i) => (
              <div
                key={`collision-${i}`}
                className="collision-rect"
                style={{
                  left: c.x * CELL_SIZE,
                  top: c.y * CELL_SIZE,
                  width: c.width * CELL_SIZE,
                  height: c.height * CELL_SIZE,
                }}
              />
            ))}

            {npcs.map((npc) => {
              const isSelected =
                selectedObject?.type === 'npc' &&
                selectedObject.x === npc.x &&
                selectedObject.y === npc.y;
              return (
                <div
                  key={npc.id}
                  className={`npc-sprite ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: npc.x * CELL_SIZE,
                    top: npc.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  onClick={(e) => handleNpcClick(npc, e)}
                >
                  <span className="npc-emoji">🧙</span>
                  <span className="npc-dialog-icon">💬</span>
                  <span
                    className="npc-direction"
                    style={{
                      transform: `rotate(${DIRECTION_ROTATION[npc.direction]}deg) translateY(-6px)`,
                    }}
                  />
                </div>
              );
            })}

            <div
              className={`player-sprite ${!playerMoving ? 'idle' : ''}`}
              style={{
                left: playerPos.x * CELL_SIZE,
                top: playerPos.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              <span
                className="player-emoji"
                style={{
                  transform: `scaleX(${playerDirection === 'left' ? -1 : 1})`,
                }}
              >
                🧝
              </span>
            </div>

            {renderRectSelect()}
          </div>
          <div className="canvas-parallax" />
        </div>
      </div>

      {draggingTile && dragPos && (
        <div
          className="drag-preview"
          style={{
            left: dragPos.x - 20,
            top: dragPos.y - 20,
          }}
        >
          {draggingTile.emoji}
        </div>
      )}
    </>
  );
};

export default MapEditor;
