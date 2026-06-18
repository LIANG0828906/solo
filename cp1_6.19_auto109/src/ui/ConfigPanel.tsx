import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomState } from '../domain/roomState';
import {
  PRESET_COLORS,
  MATERIALS,
  FURNITURE_LAYOUT,
  FurnitureType,
  MaterialType,
  DECORATION_NAMES,
  DECORATION_LIMITS,
  ROOM_CONFIG,
  DecorationType,
} from '../domain/roomData';

function ColorPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="color-picker">
      {PRESET_COLORS.map((color) => (
        <div
          key={color}
          className={`color-swatch ${selected === color ? 'active' : ''}`}
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            backgroundColor: color,
            cursor: 'pointer',
            border: selected === color ? '2px solid #5A7A9A' : '2px solid transparent',
            boxSizing: 'border-box',
            transition: 'transform 0.2s',
          }}
          onClick={() => onChange(color)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ))}
    </div>
  );
}

function MaterialSelector({
  selected,
  onChange,
}: {
  selected: MaterialType;
  onChange: (material: MaterialType) => void;
}) {
  return (
    <div className="material-selector">
      {MATERIALS.map((mat) => (
        <button
          key={mat.id}
          className="material-btn"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: selected === mat.id ? '2px solid #5A7A9A' : '1px solid #ddd',
            backgroundColor: selected === mat.id ? '#5A7A9A' : '#fff',
            color: selected === mat.id ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.15s',
          }}
          onClick={() => onChange(mat.id)}
        >
          {mat.name}
        </button>
      ))}
    </div>
  );
}

export default function ConfigPanel() {
  const { state, dispatch, styles } = useRoomState();
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureType | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<FurnitureType>;
      setSelectedFurniture(customEvent.detail);
    };
    window.addEventListener('open-furniture-panel', handler);
    return () => window.removeEventListener('open-furniture-panel', handler);
  }, []);

  const selectedFurnitureData = selectedFurniture
    ? state.furniture.find((f) => f.id === selectedFurniture)
    : null;

  const getDecorationCount = (type: DecorationType) =>
    state.decorations.filter((d) => d.type === type).length;

  return (
    <div className="config-panel">
      <div className="config-card">
        <div className="card-title">装修风格</div>
        <div className="style-grid">
          {styles.map((s) => (
            <button
              key={s.id}
              className={`style-btn ${state.currentStyle === s.id ? 'active' : ''}`}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: state.currentStyle === s.id ? '2px solid #5A7A9A' : '1px solid #ddd',
                backgroundColor: state.currentStyle === s.id ? '#5A7A9A' : '#fff',
                color: state.currentStyle === s.id ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onClick={() => dispatch({ type: 'CHANGE_STYLE', styleId: s.id })}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="config-card">
        <div className="card-title">家具配置</div>
        <div className="furniture-list">
          {Object.values(FURNITURE_LAYOUT).map((preset) => (
            <button
              key={preset.id}
              className={`furniture-item-btn ${selectedFurniture === preset.id ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 8,
                border: selectedFurniture === preset.id ? '2px solid #5A7A9A' : '1px solid #e0e0e0',
                backgroundColor: selectedFurniture === preset.id ? '#EEF3F8' : '#fff',
                cursor: 'pointer',
                marginBottom: 8,
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onClick={() => setSelectedFurniture(preset.id)}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: state.furniture.find((f) => f.id === preset.id)?.color || '#ccc',
                  marginRight: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
              <span style={{ fontSize: 14, color: '#333' }}>{preset.name}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedFurnitureData && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="furniture-detail-panel"
              style={{
                width: 360,
                backgroundColor: '#FAFAFA',
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 16,
                  color: '#333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {FURNITURE_LAYOUT[selectedFurnitureData.id].name}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#999',
                    padding: 4,
                  }}
                  onClick={() => setSelectedFurniture(null)}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>颜色</div>
                <ColorPicker
                  selected={selectedFurnitureData.color}
                  onChange={(color) =>
                    dispatch({
                      type: 'UPDATE_FURNITURE_COLOR',
                      id: selectedFurnitureData.id,
                      color,
                    })
                  }
                />
              </div>

              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>材质</div>
                <MaterialSelector
                  selected={selectedFurnitureData.material}
                  onChange={(material) =>
                    dispatch({
                      type: 'UPDATE_FURNITURE_MATERIAL',
                      id: selectedFurnitureData.id,
                      material,
                    })
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="config-card">
        <div className="card-title">装饰品管理</div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
          点击添加到房间（每种限2个）
        </div>
        <div className="decoration-grid">
          {(Object.keys(DECORATION_NAMES) as DecorationType[]).map((type) => {
            const count = getDecorationCount(type);
            const maxed = count >= DECORATION_LIMITS[type];
            return (
              <button
                key={type}
                className="decoration-add-btn"
                disabled={maxed}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  backgroundColor: maxed ? '#f5f5f5' : '#fff',
                  cursor: maxed ? 'not-allowed' : 'pointer',
                  opacity: maxed ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
                onClick={() =>
                  dispatch({
                    type: 'ADD_DECORATION',
                    decorationType: type,
                    x: 100 + Math.random() * (ROOM_CONFIG.width - 200),
                    y: 100 + Math.random() * (ROOM_CONFIG.height - 200),
                  })
                }
              >
                <span style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                  {DECORATION_NAMES[type]}
                </span>
                <span style={{ fontSize: 11, color: '#999' }}>
                  {count}/{DECORATION_LIMITS[type]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
