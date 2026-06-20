import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomState } from '../domain/roomState';
import {
  ROOM_CONFIG,
  getStyleById,
  FurnitureType,
  FURNITURE_LAYOUT,
  DecorationState,
  SIZE_SCALE,
  DecorationType,
} from '../domain/roomData';
import { FaCouch, FaCoffee, FaTv, FaUtensils, FaBook, FaStar, FaVial, FaLightbulb, FaVectorSquare } from 'react-icons/fa';

interface DecorationPanelState {
  id: string;
  x: number;
  y: number;
}

const furnitureIcons: Record<FurnitureType, React.ReactNode> = {
  sofa: <FaCouch size={18} />,
  table: <FaCoffee size={18} />,
  tvCabinet: <FaTv size={18} />,
  diningTable: <FaUtensils size={18} />,
  bookshelf: <FaBook size={18} />,
};

const decorationIcons: Record<DecorationType, React.ReactNode> = {
  pillow: <FaStar size={20} />,
  vase: <FaVial size={20} />,
  lamp: <FaLightbulb size={20} />,
  rug: <FaVectorSquare size={20} />,
};

function getMaterialPattern(material: string): string {
  switch (material) {
    case 'fabric':
      return 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)';
    case 'leather':
      return 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)';
    case 'matte':
      return 'radial-gradient(ellipse at center, rgba(0,0,0,0.02), transparent 70%)';
    default:
      return 'linear-gradient(135deg, rgba(255,255,255,0.3), transparent 50%)';
  }
}

export default function RoomCanvas() {
  const { state, dispatch } = useRoomState();
  const style = getStyleById(state.currentStyle);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [decorationPanel, setDecorationPanel] = useState<DecorationPanelState | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(40, Math.min(ROOM_CONFIG.width - 40, e.clientX - rect.left - dragOffset.current.x));
      const y = Math.max(40, Math.min(ROOM_CONFIG.height - 40, e.clientY - rect.top - dragOffset.current.y));
      dispatch({ type: 'UPDATE_DECORATION_POSITION', id: dragging, x, y });
    },
    [dragging, dispatch]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleFurnitureClick = (id: FurnitureType) => {
    const event = new CustomEvent('open-furniture-panel', { detail: id });
    window.dispatchEvent(event);
  };

  const handleDecorationClick = (decoration: DecorationState, e: React.MouseEvent) => {
    e.stopPropagation();
    if (decorationPanel?.id === decoration.id) {
      setDecorationPanel(null);
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDecorationPanel({
        id: decoration.id,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleDecorationDragStart = (decoration: DecorationState, e: React.MouseEvent) => {
    e.stopPropagation();
    setDecorationPanel(null);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = {
      x: e.clientX - rect.left - decoration.x,
      y: e.clientY - rect.top - decoration.y,
    };
    setDragging(decoration.id);
  };

  const renderFloor = () => {
    const squares = [];
    const size = 28;
    for (let y = ROOM_CONFIG.wallThickness; y < ROOM_CONFIG.height - ROOM_CONFIG.wallThickness; y += size) {
      for (let x = ROOM_CONFIG.wallThickness; x < ROOM_CONFIG.width - ROOM_CONFIG.wallThickness; x += size) {
        const row = Math.floor((y - ROOM_CONFIG.wallThickness) / size);
        const col = Math.floor((x - ROOM_CONFIG.wallThickness) / size);
        const color = (row + col) % 2 === 0 ? style.floorColor1 : style.floorColor2;
        squares.push(
          <div
            key={`${x}-${y}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              backgroundColor: color,
            }}
          />
        );
      }
    }
    return squares;
  };

  const currentDecoration = state.decorations.find((d) => d.id === decorationPanel?.id);

  return (
    <div
      ref={containerRef}
      className="room-canvas-container"
      onClick={() => setDecorationPanel(null)}
    >
      <motion.div
        key={state.currentStyle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        className="room-canvas"
        style={{
          width: ROOM_CONFIG.width,
          height: ROOM_CONFIG.height,
          position: 'relative',
          backgroundColor: style.wallColor,
        }}
      >
        {renderFloor()}

        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ROOM_CONFIG.width,
            height: ROOM_CONFIG.height,
            pointerEvents: 'none',
          }}
        >
          <rect
            x={0}
            y={0}
            width={ROOM_CONFIG.width}
            height={ROOM_CONFIG.height}
            fill="none"
            stroke="#D3D3D3"
            strokeWidth={2}
          />
          <rect
            x={ROOM_CONFIG.wallThickness}
            y={ROOM_CONFIG.wallThickness}
            width={ROOM_CONFIG.width - ROOM_CONFIG.wallThickness * 2}
            height={ROOM_CONFIG.height - ROOM_CONFIG.wallThickness * 2}
            fill="none"
            stroke="#D3D3D3"
            strokeWidth={2}
          />
        </svg>

        <AnimatePresence mode="wait">
          {state.furniture.map((furniture) => (
            <motion.div
              key={furniture.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="furniture-item"
              style={{
                position: 'absolute',
                left: furniture.x,
                top: furniture.y,
                width: furniture.width,
                height: furniture.height,
                backgroundColor: furniture.color,
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                backgroundImage: getMaterialPattern(furniture.material),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => handleFurnitureClick(furniture.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={FURNITURE_LAYOUT[furniture.id].name}
            >
              {furnitureIcons[furniture.id]}
            </motion.div>
          ))}
        </AnimatePresence>

        {state.decorations.map((decoration) => {
          const scale = SIZE_SCALE[decoration.size];
          const isDragging = dragging === decoration.id;
          return (
            <motion.div
              key={decoration.id}
              animate={{
                scale,
                x: isDragging ? 5 : 0,
                y: isDragging ? 5 : 0,
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                left: decoration.x - 15,
                top: decoration.y - 15,
                width: 30,
                height: 30,
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDragging ? 'grabbing' : 'grab',
                color: '#5A7A9A',
                filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
                zIndex: isDragging ? 100 : 10,
                userSelect: 'none',
              }}
              onClick={(e) => handleDecorationClick(decoration, e)}
              onMouseDown={(e) => handleDecorationDragStart(decoration, e)}
            >
              {decorationIcons[decoration.type]}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {decorationPanel && currentDecoration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="decoration-panel"
              style={{
                position: 'absolute',
                left: Math.min(decorationPanel.x, ROOM_CONFIG.width - 220),
                top: Math.min(decorationPanel.y, ROOM_CONFIG.height - 180),
                width: 200,
                backgroundColor: '#FAFAFA',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: 12,
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#333' }}>
                装饰品设置
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>尺寸</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    className="size-btn"
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 6,
                      border: currentDecoration.size === size ? '2px solid #5A7A9A' : '1px solid #ddd',
                      backgroundColor: currentDecoration.size === size ? '#5A7A9A' : '#fff',
                      color: currentDecoration.size === size ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                    onClick={() =>
                      dispatch({ type: 'UPDATE_DECORATION_SIZE', id: decorationPanel.id, size })
                    }
                  >
                    {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
              <button
                className="remove-btn"
                style={{
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 8,
                  backgroundColor: '#E07A5F',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => {
                  dispatch({ type: 'REMOVE_DECORATION', id: decorationPanel.id });
                  setDecorationPanel(null);
                }}
              >
                删除装饰品
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
