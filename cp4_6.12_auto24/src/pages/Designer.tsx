import { useState, useRef, useEffect, useCallback } from 'react';
import { useDesignerStore } from '../store/designerStore';
import { COLORS, SHAPES, SHAPE_NAMES, orderApi, Tile } from '../api';
import './Designer.css';

const GRID_SIZE = 60;
const CELL_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

interface DragState {
  isDragging: boolean;
  tile: Tile | null;
  source: 'library' | 'canvas' | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const Designer = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    source: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
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

  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { gridX: -1, gridY: -1 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    return { gridX, gridY };
  }, []);

  const isInBounds = (gridX: number, gridY: number) => {
    return gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE;
  };

  const isPositionOccupied = (gridX: number, gridY: number, excludeId?: string) => {
    return tiles.some((t) => t.gridX === gridX && t.gridY === gridY && t.id !== excludeId);
  };

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
    setDragPosition({ x: e.clientX, y: e.clientY });
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
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    setDragPosition({ x: e.clientX, y: e.clientY });
  }, [dragState.isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.tile) {
      setDragState({ isDragging: false, tile: null, source: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
      return;
    }

    const { gridX, gridY } = getGridPosition(e.clientX, e.clientY);

    if (isInBounds(gridX, gridY) && !isPositionOccupied(gridX, gridY, dragState.tile.id)) {
      if (dragState.source === 'library') {
        addTile({
          ...dragState.tile,
          gridX,
          gridY,
        });
      } else if (dragState.source === 'canvas' && dragState.tile.id !== 'drag-preview') {
        const originalTile = tiles.find(t => t.id === dragState.tile?.id);
        if (originalTile && (originalTile.gridX !== gridX || originalTile.gridY !== gridY)) {
          saveToHistory();
          updateTilePosition(dragState.tile.id, gridX, gridY);
        }
      }
    }

    setDragState({ isDragging: false, tile: null, source: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  }, [dragState, getGridPosition, addTile, updateTilePosition, tiles, saveToHistory]);

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

  const renderTileShape = (shape: string, color: string, size: number = CELL_SIZE) => {
    const style = { width: size, height: size, backgroundColor: color };

    switch (shape) {
      case 'square':
        return <div className="tile-shape tile-square" style={style} />;
      case 'circle':
        return <div className="tile-shape tile-circle" style={style} />;
      case 'triangle':
        return (
          <div
            className="tile-shape tile-triangle"
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`,
              backgroundColor: 'transparent',
            }}
          />
        );
      case 'hexagon':
        return (
          <div className="tile-shape tile-hexagon" style={{ width: size, height: size }}>
            <div style={{ backgroundColor: color, width: '100%', height: '100%' }} />
          </div>
        );
      default:
        return <div className="tile-shape tile-square" style={style} />;
    }
  };

  const tileCounts = getTilesByShapeAndColor();

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
              {Object.entries(tileCounts).map(([key, count]) => {
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
            </div>
          </div>
        </div>

        <div className="canvas-wrapper card">
          <div
            ref={canvasRef}
            className="canvas-container"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onClick={handleCanvasClick}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="canvas-grid" style={{
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
            }} />

            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`canvas-tile ${selectedTileId === tile.id ? 'selected' : ''} ${dragState.tile?.id === tile.id ? 'dragging' : ''}`}
                style={{
                  left: tile.gridX * CELL_SIZE,
                  top: tile.gridY * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
                onMouseDown={(e) => handleTileMouseDown(tile, e)}
                onClick={(e) => handleTileClick(tile, e)}
                onContextMenu={(e) => handleContextMenu(e, tile)}
              >
                {renderTileShape(tile.shape, tile.color, CELL_SIZE)}
              </div>
            ))}
          </div>

          <div className="canvas-hint">
            💡 从左侧材料库拖拽瓷砖到画布 | 点击碎片可更换颜色 | Delete 键删除 | Ctrl+Z 撤销
          </div>
        </div>
      </div>

      {dragState.isDragging && dragState.tile && (
        <div
          className="drag-preview"
          style={{
            left: dragPosition.x - dragState.offsetX,
            top: dragPosition.y - dragState.offsetY,
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
