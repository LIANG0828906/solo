import React from 'react';
import { useAnimationStore } from './store/useAnimationStore';

export const PropertyPanel: React.FC = () => {
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const keyframes = useAnimationStore((s) => s.keyframes);
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe);

  const selected = keyframes.find((k) => k.id === selectedId) ?? null;

  if (!selected) {
    return (
      <div
        style={{
          width: 260,
          backgroundColor: '#1E1E2E',
          borderRadius: 8,
          padding: 16,
          color: '#8888AA',
          fontSize: 13,
        }}
      >
        请选择一个关键帧以编辑属性
      </div>
    );
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: 500,
  };

  const inputWrapperStyle: React.CSSProperties = {
    backgroundColor: '#2B2B3D',
    border: '1px solid #3A3A5C',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#E0E0E0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s ease-out',
    width: '100%',
    boxSizing: 'border-box',
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#6C63FF';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#3A3A5C';
  };

  return (
    <div
      style={{
        width: 260,
        backgroundColor: '#1E1E2E',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0' }}>
        关键帧属性
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>时间点 (秒)</label>
        <input
          type="number"
          min="0"
          max="4"
          step="0.1"
          value={selected.time}
          onChange={(e) => updateKeyframe(selected.id, { time: parseFloat(e.target.value) || 0 })}
          style={inputWrapperStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: '#E0E0E0', marginTop: 4 }}>
        Transform
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Translate X (px)</label>
        <input
          type="number"
          value={selected.transform.translateX}
          onChange={(e) =>
            updateKeyframe(selected.id, {
              transform: {
                translateX: parseFloat(e.target.value) || 0,
                translateY: selected.transform.translateY,
                rotate: selected.transform.rotate,
                scale: selected.transform.scale,
              },
            })
          }
          style={inputWrapperStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Translate Y (px)</label>
        <input
          type="number"
          value={selected.transform.translateY}
          onChange={(e) =>
            updateKeyframe(selected.id, {
              transform: {
                translateX: selected.transform.translateX,
                translateY: parseFloat(e.target.value) || 0,
                rotate: selected.transform.rotate,
                scale: selected.transform.scale,
              },
            })
          }
          style={inputWrapperStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Rotate (度)</label>
        <input
          type="number"
          value={selected.transform.rotate}
          onChange={(e) =>
            updateKeyframe(selected.id, {
              transform: {
                translateX: selected.transform.translateX,
                translateY: selected.transform.translateY,
                rotate: parseFloat(e.target.value) || 0,
                scale: selected.transform.scale,
              },
            })
          }
          style={inputWrapperStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Scale</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={selected.transform.scale}
          onChange={(e) =>
            updateKeyframe(selected.id, {
              transform: {
                translateX: selected.transform.translateX,
                translateY: selected.transform.translateY,
                rotate: selected.transform.rotate,
                scale: parseFloat(e.target.value) || 0,
              },
            })
          }
          style={inputWrapperStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={labelStyle}>Opacity</label>
          <span style={{ fontSize: 12, color: '#8888AA' }}>{selected.opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={selected.opacity}
          onChange={(e) => updateKeyframe(selected.id, { opacity: parseFloat(e.target.value) })}
          style={{ accentColor: '#6C63FF' }}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>背景颜色</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            type="color"
            value={selected.backgroundColor}
            onChange={(e) => updateKeyframe(selected.id, { backgroundColor: e.target.value })}
            style={{
              width: 40,
              height: 32,
              border: 'none',
              borderRadius: 6,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          />
          <input
            type="text"
            value={selected.backgroundColor}
            onChange={(e) => updateKeyframe(selected.id, { backgroundColor: e.target.value })}
            style={inputWrapperStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
      </div>
    </div>
  );
};
