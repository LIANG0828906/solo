import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { COLORS, SHAPES, SHAPE_NAMES, orderApi, Tile } from '../api';
import './Designer.css';

const GRID_SIZE = 60;
const CELL_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const BOUNCE_BACK_DISTANCE = 8;

interface DragState {
  isDragging: boolean;
  tile: Tile | null;
  source: 'library' | 'canvas' | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface TileShapeProps {
  shape: string;
  color: string;
  size?: number;
}

const TileShape = memo(({ shape, color, size = CELL_SIZE }: TileShapeProps) => {
  switch (shape) {
    case 'square':
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      );
    case 'circle':
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: '50%',
          }}
        />
      );
    case 'triangle':
      return (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size / 2}px solid transparent`,
            borderRight: `${size / 2}px solid transparent`,
            borderBottom: `${size}px solid ${color}`,
          }}
        />
      );
    case 'hexagon':
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          }}
        />
      );
    default:
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      );
  }
});

TileShape.displayName = 'TileShape';

interface CanvasTileProps {
  tile: Tile;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const CanvasTile = memo(({
  tile,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onContextMenu,
}: CanvasTileProps) => {
  return (
    <div
      className={`canvas-tile ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: tile.gridX * CELL_SIZE,
        top: tile.gridY * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <TileShape shape={tile.shape} color={tile.color} size={CELL_SIZE} />
    </div>
  );
});

CanvasTile.displayName = 'CanvasTile';

const Designer = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    source: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [snappedPosition, setSnappedPosition] = useState<{ gridX: number; gridY: number; valid: boolean } | null>(null);
  const [bounceOffset, setBounceOffset] = useState({ x: 0, y: 0 });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [selectedShape, setSelectedShape] = useState<string>('square');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 });
  const [colorPickerTileId, setColorPickerTileId] = useState<string | null>(null);

  const {
    tiles,
    selectedTileId,
    addTile,
    removeTile,
    updateTilePosition,
    updateTileColor,
    selectTile,
    clearCanvas,
    undo,
    redo,
    saveToHistory,
    getTileCount,
    getTilesByShapeAndColor,
  } = useDesignerStore();

  const tilesSet = useMemo(() => {
    const set = new Set<string>();
    tiles.forEach((t) => set.add(`${t.gridX}-${t.gridY}`));
    return set;
  }, [tiles]);

  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { gridX: -1, gridY: -1, inBounds: false, snappedX: 0, snappedY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const rawGridX = x / CELL_SIZE;
    const rawGridY = y / CELL_SIZE;

    const gridX = Math.round(rawGridX);
    const gridY = Math.round(rawGridY);

    const snappedX = gridX * CELL_SIZE;
    const snappedY = gridY * CELL_SIZE;

    const inBounds = gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE;

    return { gridX, gridY, inBounds, snappedX, snappedY, rawX: x, rawY: y };
  }, []);

  const isPositionOccupied = useCallback((gridX: number, gridY: number, excludeId?: string) => {
    if (excludeId) {
      return tiles.some((t) => t.gridX === gridX && t.gridY === gridY && t.id !== excludeId);
    }
    return tilesSet.has(`${gridX}-${gridY}`);
  }, [tiles, tilesSet]);

  const handleLibraryMouseDown = (shape: string, color: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newTile: Tile = {
      id: 'drag-preview',
      shape: shape as Tile['shape'],
      color,
      gridX: 0,
      gridY: 0,
    };

    setDragState({
      isDragging: true,
      tile: newTile,
      source: 'library',
      startX: e.clientX,
      startY: e.clientY,
      offsetX: CELL_SIZE / 2,
      offsetY: CELL_SIZE / 2,
    });
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTileMouseDown = (tile: Tile, e: React.MouseEvent) => {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();

    selectTile(tile.id);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tilePixelX = tile.gridX * CELL_SIZE;
    const tilePixelY = tile.gridY * CELL_SIZE;

    setDragState({
      isDragging: true,
      tile: { ...tile },
      source: 'canvas',
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left - tilePixelX,
      offsetY: e.clientY - rect.top - tilePixelY,
    });
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      const pos = getGridPosition(e.clientX, e.clientY);

      let bx = 0;
      let by = 0;
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const localX = e.clientX - rect.left - dragState.offsetX + CELL_SIZE / 2;
        const localY = e.clientY - rect.top - dragState.offsetY + CELL_SIZE / 2;

        if (localX < 0) bx = BOUNCE_BACK_DISTANCE * (localX / 50);
        if (localX > CANVAS_SIZE) bx = -BOUNCE_BACK_DISTANCE * ((localX - CANVAS_SIZE) / 50);
        if (localY < 0) by = BOUNCE_BACK_DISTANCE * (localY / 50);
        if (localY > CANVAS_SIZE) by = -BOUNCE_BACK_DISTANCE * ((localY - CANVAS_SIZE) / 50);
      }
      setBounceOffset({ x: bx, y: by });

      if (pos.inBounds) {
        const valid = !isPositionOccupied(pos.gridX, pos.gridY, dragState.tile?.id);
        setSnappedPosition({ gridX: pos.gridX, gridY: pos.gridY, valid });
      } else {
        setSnappedPosition(null);
      }
    });
  }, [dragState.isDragging, dragState.offsetX, dragState.offsetY, dragState.tile?.id, getGridPosition, isPositionOccupied]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.tile) {
      setDragState({ isDragging: false, tile: null, source: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
      setSnappedPosition(null);
      setBounceOffset({ x: 0, y: 0 });
      return;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const pos = getGridPosition(e.clientX, e.clientY);

    if (pos.inBounds && !isPositionOccupied(pos.gridX, pos.gridY, dragState.tile.id)) {
      if (dragState.source === 'library') {
        addTile({
          ...dragState.tile,
          gridX: pos.gridX,
          gridY: pos.gridY,
        });
      } else if (dragState.source === 'canvas' && dragState.tile.id !== 'drag-preview') {
        const originalTile = tiles.find(t => t.id === dragState.tile?.id);
        if (originalTile && (originalTile.gridX !== pos.gridX || originalTile.gridY !== pos.gridY)) {
          saveToHistory();
          updateTilePosition(dragState.tile.id, pos.gridX, pos.gridY);
        }
      }
    }

    setDragState({ isDragging: false, tile: null, source: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
    setSnappedPosition(null);
    setBounceOffset({ x: 0, y: 0 });
  }, [dragState, getGridPosition, isPositionOccupied, addTile, updateTilePosition, tiles, saveToHistory]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectTile(null);
      setShowColorPicker(false);
    }
  };

  const handleTileClick = (tile: Tile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dragState.isDragging) {
      selectTile(tile.id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setColorPickerPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
      setColorPickerTileId(tile.id);
      setShowColorPicker(true);
    }
  };

  const handleColorChange = (color: string) => {
    if (colorPickerTileId) {
      updateTileColor(colorPickerTileId, color);
    }
    setShowColorPicker(false);
    setColorPickerTileId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tile: Tile) => {
    e.preventDefault();
    selectTile(tile.id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTileId && !showColorPicker) {
          e.preventDefault();
          removeTile(selectedTileId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        selectTile(null);
        setShowColorPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTileId, removeTile, undo, redo, selectTile, showColorPicker]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('请输入客户姓名');
      return;
    }
    if (tiles.length === 0) {
      alert('请先添加至少一块瓷砖');
      return;
    }

    try {
      await orderApi.create({
        tiles,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
      });
      setOrderSubmitted(true);
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSubmitted(false);
        setCustomerName('');
        setCustomerEmail('');
        clearCanvas();
      }, 2000);
    } catch (err) {
      console.error('提交订单失败:', err);
      alert('提交订单失败，请稍后重试');
    }
  };

  const tileCounts = getTilesByShapeAndColor();

  const renderTileShape = (shape: string, color: string, size: number = CELL_SIZE) => {
    return <TileShape shape={shape} color={color} size={size} />;
  };

  const shouldRenderTiles = useMemo(() => {
    if (tiles.length <= 80) return true;
    return true;
  }, [tiles.length]);

  const tilesToRender = useMemo(() => {
    if (tiles.length <= 200) return tiles;
    return tiles.slice(-200);
  }, [tiles]);

  return (
    <div className="designer-page">
      <h1 className="page-title">马赛克图案设计器</h1>

      <div className="designer-toolbar">
        <button className="btn btn-secondary btn-small" onClick={undo}>
          ↶ 撤销
        </button>
        <button className="btn btn-secondary btn-small" onClick={redo}>
          ↷ 重做
        </button>
        <button className="btn btn-secondary btn-small" onClick={clearCanvas}>
          🗑 清空
        </button>
        <div className="tile-count">
          瓷砖数量: <strong>{getTileCount()}</strong> / {GRID_SIZE * GRID_SIZE}
        </div>
        <button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>
          提交定制订单
        </button>
      </div>

      <div className="designer-layout">
        <div className="materials-library card">
          <h3 className="section-title">材料库</h3>

          <div className="library-section">
            <h4>形状选择</h4>
            <div className="shape-picker">
              {SHAPES.map((shape) => (
                <button
                  key={shape}
                  className={`shape-btn ${selectedShape === shape ? 'active' : ''}`}
                  onClick={() => setSelectedShape(shape)}
                  title={SHAPE_NAMES[shape]}
                >
                  {renderTileShape(shape, selectedColor, 24)}
                  <span>{SHAPE_NAMES[shape]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="library-section">
            <h4>颜色选择</h4>
            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="library-section">
            <h4>预览（拖拽到画布）</h4>
            <div
              className="tile-preview"
              onMouseDown={(e) => handleLibraryMouseDown(selectedShape, selectedColor, e)}
            >
              {renderTileShape(selectedShape, selectedColor, 32)}
              <span className="preview-label">点击拖拽</span>
            </div>
          </div>

          <div className="library-section stats-section">
            <h4>当前材料统计</h4>
            <div className="stats-list">
              {Object.entries(tileCounts).slice(0, 12).map(([key, count]) => {
                const [shape, color] = key.split('-');
                return (
                  <div key={key} className="stats-item">
                    <div className="stats-color" style={{ backgroundColor: color }} />
                    <span className="stats-shape">{SHAPE_NAMES[shape] || shape}</span>
                    <span className="stats-count">×{count}</span>
                  </div>
                );
              })}
              {Object.keys(tileCounts).length === 0 && (
                <div className="stats-empty">暂无瓷砖</div>
              )}
              {Object.keys(tileCounts).length > 12 && (
                <div className="stats-more">还有 {Object.keys(tileCounts).length - 12} 种...</div>
              )}
            </div>
          </div>
        </div>

        <div className="canvas-wrapper card">
          <div
            ref={canvasRef}
            className="canvas-container"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, minHeight: 400 }}
            onClick={handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="canvas-grid" style={{
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
            }} />

            {snappedPosition && (
              <div
                className={`snap-indicator ${snappedPosition.valid ? 'valid' : 'invalid'}`}
                style={{
                  left: snappedPosition.gridX * CELL_SIZE,
                  top: snappedPosition.gridY * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            )}

            {shouldRenderTiles && tilesToRender.map((tile) => (
              <CanvasTile
                key={tile.id}
                tile={tile}
                isSelected={selectedTileId === tile.id}
                isDragging={dragState.tile?.id === tile.id}
                onMouseDown={(e) => handleTileMouseDown(tile, e)}
                onClick={(e) => handleTileClick(tile, e)}
                onContextMenu={(e) => handleContextMenu(e, tile)}
              />
            ))}
          </div>

          <div className="canvas-hint">
            💡 从左侧材料库拖拽瓷砖到画布（自动吸附网格）| 点击碎片更换颜色 | Delete删除 | Ctrl+Z撤销
          </div>
        </div>
      </div>

      {dragState.isDragging && dragState.tile && (
        <div
          className="drag-preview drag-animated"
          style={{
            left: lastPosRef.current.x - dragState.offsetX + bounceOffset.x,
            top: lastPosRef.current.y - dragState.offsetY + bounceOffset.y,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          {renderTileShape(dragState.tile.shape, dragState.tile.color, CELL_SIZE)}
        </div>
      )}

      {showColorPicker && (
        <div
          className="floating-color-picker card"
          style={{ left: colorPickerPos.x, top: colorPickerPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="color-picker-grid">
            {COLORS.map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
          <button
            className="btn btn-secondary btn-small color-picker-close"
            onClick={() => {
              setShowColorPicker(false);
              setColorPickerTileId(null);
            }}
          >
            关闭
          </button>
        </div>
      )}

      {showOrderModal && (
        <div className="modal-overlay" onClick={() => !orderSubmitted && setShowOrderModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            {orderSubmitted ? (
              <div className="order-success">
                <div className="success-icon">✓</div>
                <h3>订单提交成功！</h3>
                <p>我们会尽快与您联系确认订单详情。</p>
              </div>
            ) : (
              <>
                <h3 className="section-title">提交定制订单</h3>
                <div className="form-group">
                  <label>客户姓名 *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div className="form-group">
                  <label>联系邮箱</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="选填"
                  />
                </div>
                <div className="order-summary">
                  <p>瓷砖总数: <strong>{getTileCount()}</strong> 块</p>
                  <p>材料种类: <strong>{Object.keys(tileCounts).length}</strong> 种</p>
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowOrderModal(false)}
                  >
                    取消
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmitOrder}>
                    确认提交
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Designer;
