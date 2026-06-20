import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from './store';
import { PRESET_COLORS, PANEL_BG_COLOR, TEXT_COLOR, GRID_BG_COLOR } from './types';
import { Tile } from './types';

const colorNames = [
  '红', '绿', '蓝', '黄', '紫', '橙', '青', '粉', '褐', '白', '浅灰', '黑',
];

const panelVariants = {
  open: { height: 'auto', opacity: 1, overflow: 'visible' },
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
};

export const BrushPanel = () => {
  const {
    currentTool,
    brushColor,
    setTool,
    setBrushColor,
    setSelectedTile,
  } = useMapStore();

  const [showPanel, setShowPanel] = useState(true);
  const [brushClickCount, setBrushClickCount] = useState(0);
  const brushClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrushClick = (color: string) => {
    if (currentTool !== 'brush') {
      setBrushColor(color);
      setTool('brush');
      setSelectedTile(null);
      setBrushClickCount(1);
      if (brushClickTimeout.current) {
        clearTimeout(brushClickTimeout.current);
      }
      return;
    }

    if (brushColor === color) {
      setBrushClickCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 2) {
          return 0;
        }
        return newCount;
      });

      if (brushClickTimeout.current) {
        clearTimeout(brushClickTimeout.current);
      }
      brushClickTimeout.current = setTimeout(() => {
        setBrushClickCount(0);
      }, 300);
    } else {
      setBrushColor(color);
      setBrushClickCount(1);
      if (brushClickTimeout.current) {
        clearTimeout(brushClickTimeout.current);
      }
      brushClickTimeout.current = setTimeout(() => {
        setBrushClickCount(0);
      }, 300);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: showPanel ? 180 : 40 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        backgroundColor: PANEL_BG_COLOR,
        borderRight: '2px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '2px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setShowPanel(!showPanel)}
      >
        {showPanel && (
          <span
            style={{
              color: TEXT_COLOR,
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            笔刷
          </span>
        )}
        <span style={{ color: TEXT_COLOR, fontSize: '12px' }}>
          {showPanel ? '◀' : '▶'}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {showPanel && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={panelVariants}
            transition={{ duration: 0.3 }}
            style={{ padding: '12px' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
              }}
            >
              {PRESET_COLORS.map((color, index) => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBrushClick(color)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: color,
                    border:
                      currentTool === 'brush' && brushColor === color
                        ? brushClickCount >= 2
                          ? '3px solid #fff'
                          : '2px solid #fff'
                        : '2px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  title={`${colorNames[index]} (${index + 1})`}
                >
                  {currentTool === 'brush' && brushColor === color && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: color === '#ffffff' || color === '#bdc3c7' ? '#000' : '#fff',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    >
                      {brushClickCount >= 2 ? '✓✓' : '✓'}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => {
                  setTool('select');
                  setSelectedTile(null);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: currentTool === 'select' ? '#3498db' : '#444',
                  color: TEXT_COLOR,
                  border: '2px solid #1a1a1a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                框选工具
              </button>
            </div>

            <div style={{ marginTop: '8px', fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>
              <div>提示:</div>
              <div>• 1-9 切换颜色</div>
              <div>• Shift+点击 擦除</div>
              <div>• Alt+拖拽 平移</div>
              <div>• 滚轮 缩放</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TileThumbnail = ({ tile, size = 64 }: { tile: Tile; size?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = GRID_BG_COLOR;
    ctx.fillRect(0, 0, size, size);

    const cellSize = size / Math.max(tile.width, tile.height);
    const offsetX = (size - tile.width * cellSize) / 2;
    const offsetY = (size - tile.height * cellSize) / 2;

    for (let y = 0; y < tile.height; y++) {
      for (let x = 0; x < tile.width; x++) {
        ctx.fillStyle = tile.data[y][x];
        ctx.fillRect(
          Math.floor(offsetX + x * cellSize),
          Math.floor(offsetY + y * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }, [tile, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
};

export const TilePanel = () => {
  const {
    selectedTileId,
    tiles,
    selection,
    setSelectedTile,
    saveSelectionAsTile,
    deleteTile,
    setTool,
  } = useMapStore();

  const [showPanel, setShowPanel] = useState(true);
  const [newTileName, setNewTileName] = useState('');
  const [shakeTileId, setShakeTileId] = useState<string | null>(null);

  const handleTileClick = (tile: Tile) => {
    if (selectedTileId === tile.id) {
      setShakeTileId(tile.id);
      setTimeout(() => setShakeTileId(null), 150);
    } else {
      setSelectedTile(tile.id);
    }
  };

  const handleSaveTile = () => {
    if (!selection || !newTileName.trim()) return;
    saveSelectionAsTile(newTileName.trim());
    setNewTileName('');
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: showPanel ? 200 : 40 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        backgroundColor: PANEL_BG_COLOR,
        borderLeft: '2px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '2px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setShowPanel(!showPanel)}
      >
        <span style={{ color: TEXT_COLOR, fontSize: '12px' }}>
          {showPanel ? '▶' : '◀'}
        </span>
        {showPanel && (
          <span
            style={{
              color: TEXT_COLOR,
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            图块模板
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showPanel && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={panelVariants}
            transition={{ duration: 0.3 }}
            style={{
              padding: '12px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {selection && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    color: TEXT_COLOR,
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    marginBottom: '6px',
                  }}
                >
                  保存选区为图块
                </div>
                <input
                  type="text"
                  value={newTileName}
                  onChange={(e) => setNewTileName(e.target.value)}
                  placeholder="图块名称"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1a1a1a',
                    color: TEXT_COLOR,
                    border: '2px solid #444',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleSaveTile}
                  disabled={!newTileName.trim() || tiles.length >= 8}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    backgroundColor: tiles.length >= 8 ? '#555' : '#27ae60',
                    color: TEXT_COLOR,
                    border: '2px solid #1a1a1a',
                    borderRadius: '4px',
                    cursor: tiles.length >= 8 ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                >
                  保存 ({tiles.length}/8)
                </button>
              </div>
            )}

            <div
              style={{
                color: TEXT_COLOR,
                fontSize: '11px',
                fontFamily: 'monospace',
                marginBottom: '8px',
              }}
            >
              我的图块 ({tiles.length}/8)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  animate={shakeTileId === tile.id ? {
                    x: [0, -3, 3, -3, 3, 0],
                    scale: [1, 0.95, 1.05, 0.98, 1.02, 1],
                  } : {}}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'relative',
                    border:
                      selectedTileId === tile.id
                        ? '2px solid #3498db'
                        : '2px solid #444',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: GRID_BG_COLOR,
                  }}
                  onClick={() => handleTileClick(tile)}
                  whileHover={{ scale: 1.05 }}
                >
                  <TileThumbnail tile={tile} size={80} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: TEXT_COLOR,
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      padding: '2px 4px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tile.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTile(tile.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '18px',
                      height: '18px',
                      backgroundColor: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '10px',
                      lineHeight: '1',
                      padding: 0,
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                  >
                    ×
                  </button>
                </motion.div>
              ))}

              {tiles.length === 0 && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    border: '2px dashed #444',
                    borderRadius: '4px',
                  }}
                >
                  暂无图块
                  <br />
                  使用框选工具创建
                </div>
              )}
            </div>

            {selectedTileId && (
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => {
                    setSelectedTile(null);
                    setTool('brush');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#e67e22',
                    color: TEXT_COLOR,
                    border: '2px solid #1a1a1a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  返回笔刷模式
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Sidebar = () => {
  return (
    <>
      <BrushPanel />
      <TilePanel />
    </>
  );
};

export default Sidebar;
