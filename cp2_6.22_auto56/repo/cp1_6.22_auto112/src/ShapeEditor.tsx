import React, { useState, useEffect, useRef } from 'react';
import { useApp, PRESET_COLORS } from './App';
import { Shape } from './types';

interface ShapeEditorProps {
  shape: Shape;
}

const STROKE_COLORS = [
  '#888888', '#333333', '#E74C3C', '#3498DB',
  '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'
];

export default function ShapeEditor({ shape }: ShapeEditorProps) {
  const { state, dispatch, wsBroadcast } = useApp();
  const [fillColor, setFillColor] = useState(shape.fillColor);
  const [strokeColor, setStrokeColor] = useState(shape.strokeColor);
  const [strokeWidth, setStrokeWidth] = useState(shape.strokeWidth);
  const [text, setText] = useState(shape.text);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFillColor(shape.fillColor);
    setStrokeColor(shape.strokeColor);
    setStrokeWidth(shape.strokeWidth);
    setText(shape.text);
  }, [shape.id, shape.fillColor, shape.strokeColor, shape.strokeWidth, shape.text]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeEditor();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeEditor();
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const closeEditor = () => {
    dispatch({ type: 'STOP_EDITING' });
  };

  const commitUpdates = (updates: Partial<Shape>) => {
    dispatch({
      type: 'UPDATE_SHAPE',
      payload: { id: shape.id, updates }
    });
    wsBroadcast({
      type: 'UPDATE_SHAPE',
      payload: { id: shape.id, updates }
    });
  };

  const handleFillClick = (color: string) => {
    setFillColor(color);
    commitUpdates({ fillColor: color });
  };

  const handleStrokeClick = (color: string) => {
    setStrokeColor(color);
    commitUpdates({ strokeColor: color });
  };

  const handleStrokeWidthChange = (val: number) => {
    setStrokeWidth(val);
    commitUpdates({ strokeWidth: val });
  };

  const handleTextChange = (val: string) => {
    const limited = val.slice(0, 40);
    setText(limited);
    commitUpdates({ text: limited });
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_SHAPE', payload: shape.id });
    wsBroadcast({ type: 'DELETE_SHAPE', payload: shape.id });
  };

  return (
    <div
      ref={containerRef}
      data-shape-editor
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: 16,
        width: 280,
        border: '1px solid #eee'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
          编辑图形
        </div>
        <button
          onClick={closeEditor}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#f5f5f5',
            color: '#888',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eee')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>填充颜色</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 6
          }}
        >
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleFillClick(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: color,
                border: fillColor === color ? '2px solid #4A90D9' : '1px solid #ddd',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={color}
            >
              {fillColor === color && (
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>边框颜色</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 4
          }}
        >
          {STROKE_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleStrokeClick(color)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: color,
                border: strokeColor === color ? '2px solid #4A90D9' : '1px solid #ddd',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title={color}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8
          }}
        >
          <div style={{ fontSize: 12, color: '#888' }}>边框宽度</div>
          <div
            style={{
              fontSize: 12,
              color: '#4A90D9',
              fontWeight: 600
            }}
          >
            {strokeWidth}px
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={strokeWidth}
          onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#4A90D9',
            cursor: 'pointer'
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#aaa',
            marginTop: 2
          }}
        >
          <span>1</span>
          <span>6</span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8
          }}
        >
          <div style={{ fontSize: 12, color: '#888' }}>文本内容</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>{text.length}/40</div>
        </div>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="输入图形文本..."
          rows={3}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: 13,
            resize: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#4A90D9')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
        />
      </div>

      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 6,
          backgroundColor: '#fef2f2',
          color: '#e74c3c',
          fontSize: 13,
          fontWeight: 500,
          transition: 'background-color 0.2s',
          border: '1px solid #fecaca'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
      >
        🗑 删除图形
      </button>
    </div>
  );
}
