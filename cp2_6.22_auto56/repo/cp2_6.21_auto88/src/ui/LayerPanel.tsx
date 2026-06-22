import { useState, useRef } from 'react';
import { useAppState } from '../state';
import type { Layer, BlendMode, GradientStop } from '../types';

const BLEND_MODES: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
];

const LAYER_ICONS: Record<string, string> = {
  gradient: '◐',
  particles: '●',
  geometry: '⬡',
  lines: '〰',
};

function LayerIconSVG({ type }: { type: string }) {
  const size = 22;
  switch (type) {
    case 'particles':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF7B0" stopOpacity="1" />
              <stop offset="60%" stopColor="#FFD700" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFA500" stopOpacity="0.7" />
            </radialGradient>
          </defs>
          <path
            d="M12 2 L14.5 8.5 L21 9.5 L16 14.5 L17.5 21 L12 17.5 L6.5 21 L8 14.5 L3 9.5 L9.5 8.5 Z"
            fill="url(#starGlow)"
            stroke="#FFD700"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 5 L13.3 8.2 L16.8 8.8 L14.2 11.5 L15 15 L12 13.2 L9 15 L9.8 11.5 L7.2 8.8 L10.7 8.2 Z"
            fill="#FFFEF0"
            opacity="0.6"
          />
          <circle cx="12" cy="10" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );
    case 'geometry':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64B4FF" />
              <stop offset="50%" stopColor="#4FC3F7" />
              <stop offset="100%" stopColor="#7C83FF" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.5 L20.5 7.5 L20.5 16.5 L12 21.5 L3.5 16.5 L3.5 7.5 Z"
            fill="none"
            stroke="url(#hexGrad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 5.5 L18 9 L18 15 L12 18.5 L6 15 L6 9 Z"
            fill="rgba(100, 180, 255, 0.15)"
            stroke="rgba(100, 180, 255, 0.5)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="4" fill="none" stroke="rgba(100, 180, 255, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="1.5" fill="rgba(79, 195, 247, 0.6)" />
          <circle cx="12" cy="5.5" r="1" fill="#64B4FF" />
          <circle cx="20.5" cy="12" r="1" fill="#4FC3F7" />
          <circle cx="12" cy="18.5" r="1" fill="#7C83FF" />
          <circle cx="3.5" cy="12" r="1" fill="#64B4FF" />
        </svg>
      );
    case 'gradient':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rainbow1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="20%" stopColor="#FFEAA7" />
              <stop offset="40%" stopColor="#55EFC4" />
              <stop offset="60%" stopColor="#74B9FF" />
              <stop offset="80%" stopColor="#A29BFE" />
              <stop offset="100%" stopColor="#FD79A8" />
            </linearGradient>
            <linearGradient id="rainbow2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A80" />
              <stop offset="25%" stopColor="#FFF59D" />
              <stop offset="50%" stopColor="#81C784" />
              <stop offset="75%" stopColor="#64B5F6" />
              <stop offset="100%" stopColor="#BA68C8" />
            </linearGradient>
            <linearGradient id="rainbow3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF5252" />
              <stop offset="50%" stopColor="#FFEB3B" />
              <stop offset="100%" stopColor="#448AFF" />
            </linearGradient>
          </defs>
          <path
            d="M2 18 Q12 3 22 18"
            fill="none"
            stroke="url(#rainbow1)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M4 17 Q12 5 20 17"
            fill="none"
            stroke="url(#rainbow2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M6 16 Q12 7 18 16"
            fill="none"
            stroke="url(#rainbow3)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <ellipse cx="12" cy="19" rx="10" ry="1.5" fill="rgba(100, 180, 255, 0.1)" />
        </svg>
      );
    case 'lines':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ECDC4" />
              <stop offset="50%" stopColor="#64B4FF" />
              <stop offset="100%" stopColor="#A29BFE" />
            </linearGradient>
          </defs>
          <path
            d="M1 8 Q4 4 7 8 Q10 12 13 8 Q16 4 19 8 Q22 12 24 8"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M1 13 Q4 9 7 13 Q10 17 13 13 Q16 9 19 13 Q22 17 24 13"
            fill="none"
            stroke="rgba(100, 180, 255, 0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M1 18 Q4 14 7 18 Q10 22 13 18 Q16 14 19 18 Q22 22 24 18"
            fill="none"
            stroke="rgba(78, 205, 196, 0.4)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="10" cy="8" r="0.8" fill="#4ECDC4" opacity="0.8" />
          <circle cx="17" cy="13" r="0.8" fill="#64B4FF" opacity="0.8" />
        </svg>
      );
    default:
      return null;
  }
}

const LAYER_NAMES: Record<string, string> = {
  gradient: '渐变层',
  particles: '粒子层',
  geometry: '几何层',
  lines: '线条层',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '10px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#a0a8c0',
  marginBottom: '2px',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  background: '#2a2a4a',
  borderRadius: '3px',
  outline: 'none',
  cursor: 'pointer',
  transition: 'transform 150ms',
  accentColor: '#4fc3f7',
};

const selectStyle: React.CSSProperties = {
  background: '#1e293b',
  color: '#e0e0e0',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '12px',
  cursor: 'pointer',
  outline: 'none',
  transition: 'transform 150ms',
};

const inputStyle: React.CSSProperties = {
  background: '#1e293b',
  color: '#e0e0e0',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '4px 8px',
  fontSize: '12px',
  width: '50px',
  outline: 'none',
};

function GradientControls({ layer }: { layer: Extract<Layer, { type: 'gradient' }> }) {
  const { dispatch } = useAppState();

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = layer.stops.map((s, i) => (i === index ? { ...s, ...updates } : s));
    dispatch({ type: 'UPDATE_GRADIENT_LAYER', layerId: layer.id, updates: { stops: newStops } });
  };

  const addStop = () => {
    if (layer.stops.length >= 5) return;
    const newStops = [...layer.stops, { position: 0.5, color: '#ffffff' }].sort(
      (a, b) => a.position - b.position
    );
    dispatch({ type: 'UPDATE_GRADIENT_LAYER', layerId: layer.id, updates: { stops: newStops } });
  };

  const removeStop = (index: number) => {
    if (layer.stops.length <= 2) return;
    const newStops = layer.stops.filter((_, i) => i !== index);
    dispatch({ type: 'UPDATE_GRADIENT_LAYER', layerId: layer.id, updates: { stops: newStops } });
  };

  return (
    <>
      <div style={rowStyle}>
        <span style={labelStyle}>渐变类型</span>
        <select
          value={layer.gradientType}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_GRADIENT_LAYER',
              layerId: layer.id,
              updates: { gradientType: e.target.value as 'linear' | 'radial' },
            })
          }
          style={selectStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <option value="linear">线性渐变</option>
          <option value="radial">径向渐变</option>
        </select>
      </div>

      {layer.gradientType === 'linear' && (
        <div style={rowStyle}>
          <span style={labelStyle}>角度: {layer.angle}°</span>
          <input
            type="range"
            min="0"
            max="360"
            value={layer.angle}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_GRADIENT_LAYER',
                layerId: layer.id,
                updates: { angle: parseInt(e.target.value) },
              })
            }
            style={sliderStyle}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      )}

      <div style={{ ...rowStyle, gap: '8px' }}>
        <span style={labelStyle}>颜色节点</span>
        {layer.stops.map((stop, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(stop.position * 100)}
              onChange={(e) => updateStop(i, { position: parseInt(e.target.value) / 100 })}
              style={{ flex: 1, accentColor: '#4fc3f7' }}
            />
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(i, { color: e.target.value })}
              style={{
                width: '28px',
                height: '24px',
                border: 'none',
                borderRadius: '4px',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            {layer.stops.length > 2 && (
              <button
                onClick={() => removeStop(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {layer.stops.length < 5 && (
          <button
            onClick={addStop}
            style={{
              background: '#4fc3f7',
              color: '#0a0a1a',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '11px',
              alignSelf: 'flex-start',
            }}
          >
            + 添加节点
          </button>
        )}
      </div>
    </>
  );
}

function ParticleControls({ layer }: { layer: Extract<Layer, { type: 'particles' }> }) {
  const { dispatch } = useAppState();
  return (
    <>
      <div style={rowStyle}>
        <span style={labelStyle}>粒子数量: {layer.particles.length}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>移动速度: {layer.speed.toFixed(1)}</span>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={layer.speed}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_PARTICLE_LAYER',
              layerId: layer.id,
              updates: { speed: parseFloat(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>方向角度: {layer.direction}°</span>
        <input
          type="range"
          min="0"
          max="360"
          value={layer.direction}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_PARTICLE_LAYER',
              layerId: layer.id,
              updates: { direction: parseInt(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
    </>
  );
}

function GeometryControls({ layer }: { layer: Extract<Layer, { type: 'geometry' }> }) {
  const { state, dispatch } = useAppState();
  const selectedPolygon =
    state.selectedLayerId === layer.id && state.selectedElementId
      ? layer.polygons.find((p) => p.id === state.selectedElementId)
      : null;

  if (!selectedPolygon) {
    return (
      <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '8px 0' }}>
        点击画布上的多边形选中它进行编辑
      </div>
    );
  }

  const poly = selectedPolygon;

  return (
    <>
      <div style={rowStyle}>
        <span style={labelStyle}>边数: {poly.sides}</span>
        <input
          type="range"
          min="3"
          max="8"
          value={poly.sides}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: layer.id,
              polygonId: poly.id,
              updates: { sides: parseInt(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>半径: {poly.radius.toFixed(0)}</span>
        <input
          type="range"
          min="20"
          max="300"
          value={poly.radius}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: layer.id,
              polygonId: poly.id,
              updates: { radius: parseInt(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>旋转速度: {poly.rotationSpeed.toFixed(3)}</span>
        <input
          type="range"
          min="-0.05"
          max="0.05"
          step="0.001"
          value={poly.rotationSpeed}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: layer.id,
              polygonId: poly.id,
              updates: { rotationSpeed: parseFloat(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>填充透明度: {Math.round(poly.fillOpacity * 100)}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={poly.fillOpacity * 100}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_POLYGON',
              layerId: layer.id,
              polygonId: poly.id,
              updates: { fillOpacity: parseInt(e.target.value) / 100 },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>描边色</span>
          <input
            type="color"
            value={poly.strokeColor}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_POLYGON',
                layerId: layer.id,
                polygonId: poly.id,
                updates: { strokeColor: e.target.value },
              })
            }
            style={{
              width: '40px',
              height: '28px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'transform 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>填充色</span>
          <input
            type="color"
            value={poly.fillColor}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_POLYGON',
                layerId: layer.id,
                polygonId: poly.id,
                updates: { fillColor: e.target.value },
              })
            }
            style={{
              width: '40px',
              height: '28px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'transform 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </div>
    </>
  );
}

function LinesControls({ layer }: { layer: Extract<Layer, { type: 'lines' }> }) {
  const { dispatch } = useAppState();
  return (
    <>
      <div style={rowStyle}>
        <span style={labelStyle}>曲线数量: {layer.lines.length}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>线条粗细: {layer.thickness.toFixed(1)}</span>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={layer.thickness}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_LINES_LAYER',
              layerId: layer.id,
              updates: { thickness: parseFloat(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>透明度: {layer.lineOpacity}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={layer.lineOpacity}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_LINES_LAYER',
              layerId: layer.id,
              updates: { lineOpacity: parseInt(e.target.value) },
            })
          }
          style={sliderStyle}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
    </>
  );
}

function LayerCard({ layer, index }: { layer: Layer; index: number }) {
  const { state, dispatch } = useAppState();
  const expanded = state.expandedLayers[layer.id] ?? true;
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex) && fromIndex !== index) {
      dispatch({ type: 'REORDER_LAYERS', fromIndex, toIndex: index });
    }
  };

  const isSelected = state.selectedLayerId === layer.id;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        marginBottom: '10px',
        borderRadius: '10px',
        overflow: 'hidden',
        background: dragOver ? 'rgba(79, 195, 247, 0.15)' : 'rgba(22, 33, 62, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: isSelected ? '1px solid rgba(79, 195, 247, 0.5)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isSelected
          ? '0 0 20px rgba(79, 195, 247, 0.15)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 200ms ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          cursor: 'grab',
          userSelect: 'none',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LayerIconSVG type={layer.type} />
        </span>
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: 600,
            color: '#e0e6f0',
          }}
          onClick={() => dispatch({ type: 'TOGGLE_LAYER_EXPANDED', layerId: layer.id })}
        >
          {layer.name}
        </span>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', layerId: layer.id })}
          style={{
            background: 'transparent',
            border: 'none',
            color: layer.visible ? '#4fc3f7' : '#555',
            cursor: 'pointer',
            fontSize: '15px',
            padding: '4px',
            borderRadius: '4px',
          }}
          title={layer.visible ? '隐藏' : '显示'}
        >
          {layer.visible ? '👁' : '◌'}
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_LAYER_EXPANDED', layerId: layer.id })}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
            transition: 'transform 250ms ease-out',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </button>
      </div>

      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: expanded ? '800px' : '0px',
          transition: 'max-height 250ms ease-out',
        }}
      >
        <div style={{ padding: '4px 12px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ marginTop: '10px' }}>
            <div style={rowStyle}>
              <span style={labelStyle}>全局透明度: {layer.opacity}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_LAYER_OPACITY',
                    layerId: layer.id,
                    opacity: parseInt(e.target.value),
                  })
                }
                style={sliderStyle}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>混合模式</span>
              <select
                value={layer.blendMode}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_LAYER_BLEND_MODE',
                    layerId: layer.id,
                    blendMode: e.target.value as BlendMode,
                  })
                }
                style={selectStyle}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {BLEND_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {layer.type === 'gradient' && <GradientControls layer={layer} />}
            {layer.type === 'particles' && <ParticleControls layer={layer} />}
            {layer.type === 'geometry' && <GeometryControls layer={layer} />}
            {layer.type === 'lines' && <LinesControls layer={layer} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LayerPanel() {
  const { state } = useAppState();
  const reversedLayers = [...state.layers].reverse();

  return (
    <div
      style={{
        flex: '0 0 25%',
        minWidth: '320px',
        background: '#16213e',
        padding: '16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#e0e6f0',
          marginBottom: '16px',
          letterSpacing: '0.5px',
        }}
      >
        图层控制
      </div>
      <div style={{ fontSize: '11px', color: '#7a8aa8', marginBottom: '12px' }}>
        拖拽卡片调整图层顺序（从上到下为前景到背景）
      </div>
      {reversedLayers.map((layer, reversedIndex) => {
        const originalIndex = state.layers.length - 1 - reversedIndex;
        return <LayerCard key={layer.id} layer={layer} index={originalIndex} />;
      })}
    </div>
  );
}
