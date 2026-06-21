import React from 'react';
import type { DecorElement, DecorShape } from './CanvasRenderer';

interface DecorConfigProps {
  decorations: DecorElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (shape: DecorShape) => void;
  onUpdate: (id: string, updates: Partial<DecorElement>) => void;
  onRemove: (id: string) => void;
  maxCount: number;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    backgroundColor: '#f1f3f5',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '14px',
    color: '#495057',
    marginBottom: '12px'
  }}>
    {title}
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, unit = '', onChange }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: '#6c757d' }}>{label}</span>
      <span style={{ fontSize: '12px', color: '#495057', fontWeight: 500 }}>{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        appearance: 'none',
        background: '#e9ecef',
        outline: 'none',
        cursor: 'pointer'
      }}
    />
  </div>
);

const ColorPicker: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
    <span style={{ fontSize: '12px', color: '#6c757d', minWidth: '50px' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid #dee2e6',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '28px',
          height: '28px',
          opacity: 0,
          cursor: 'pointer'
        }}
      />
    </div>
    <input
      type="text"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: '5px 8px',
        fontSize: '11px',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontFamily: 'monospace'
      }}
    />
  </div>
);

const SHAPES: { value: DecorShape; label: string }[] = [
  { value: 'circle', label: '圆形' },
  { value: 'triangle', label: '三角形' },
  { value: 'star', label: '星形' },
];

const PRESET_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#74b9ff', '#a29bfe', '#fd79a8'];

export const DecorConfig: React.FC<DecorConfigProps> = ({
  decorations,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  maxCount,
}) => {
  const selectedDecor = decorations.find((d) => d.id === selectedId);

  return (
    <div>
      <SectionTitle title="装饰元素" />
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
          已添加 {decorations.length}/{maxCount} 个
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SHAPES.map((shape) => (
            <button
              key={shape.value}
              onClick={() => onAdd(shape.value)}
              disabled={decorations.length >= maxCount}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: decorations.length >= maxCount ? '#f1f3f5' : 'white',
                color: decorations.length >= maxCount ? '#adb5bd' : '#495057',
                cursor: decorations.length >= maxCount ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (decorations.length < maxCount) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#74b9ff';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = decorations.length >= maxCount ? '#f1f3f5' : 'white';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              + {shape.label}
            </button>
          ))}
        </div>
      </div>

      {decorations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>元素列表</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {decorations.map((decor, index) => (
              <div
                key={decor.id}
                onClick={() => onSelect(decor.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: selectedId === decor.id ? '#e3f2fd' : '#f8f9fa',
                  border: selectedId === decor.id ? '1px solid #74b9ff' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: decor.shape === 'circle' ? '50%' : '2px',
                      backgroundColor: decor.color,
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#495057' }}>
                    {SHAPES.find((s) => s.value === decor.shape)?.label} {index + 1}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(decor.id);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#e9ecef',
                    color: '#6c757d',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff6b6b';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                    e.currentTarget.style.color = '#6c757d';
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDecor && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '10px' }}>
            调整元素
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '6px' }}>形状</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {SHAPES.map((shape) => (
                <button
                  key={shape.value}
                  onClick={() => onUpdate(selectedDecor.id, { shape: shape.value })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '12px',
                    border: selectedDecor.shape === shape.value ? '1px solid #74b9ff' : '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: selectedDecor.shape === shape.value ? '#e3f2fd' : 'white',
                    color: selectedDecor.shape === shape.value ? '#0984e3' : '#495057',
                    cursor: 'pointer',
                  }}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>

          <ColorPicker
            label="颜色"
            color={selectedDecor.color}
            onChange={(c) => onUpdate(selectedDecor.id, { color: c })}
          />
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onUpdate(selectedDecor.id, { color })}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: selectedDecor.color === color ? '2px solid #74b9ff' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>

          <SliderRow
            label="大小"
            value={selectedDecor.size}
            min={20}
            max={80}
            unit="px"
            onChange={(v) => onUpdate(selectedDecor.id, { size: v })}
          />
          
          <SliderRow
            label="X 位置"
            value={Math.round(selectedDecor.x)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => onUpdate(selectedDecor.id, { x: v })}
          />
          
          <SliderRow
            label="Y 位置"
            value={Math.round(selectedDecor.y)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => onUpdate(selectedDecor.id, { y: v })}
          />
          
          <SliderRow
            label="旋转"
            value={selectedDecor.rotation}
            min={0}
            max={360}
            unit="°"
            onChange={(v) => onUpdate(selectedDecor.id, { rotation: v })}
          />
        </div>
      )}
    </div>
  );
};
