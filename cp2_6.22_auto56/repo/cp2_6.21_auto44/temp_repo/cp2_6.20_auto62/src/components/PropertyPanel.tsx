import { useEffect, useState } from 'react';
import {
  X,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCw,
} from 'lucide-react';
import type { BoardElement } from '../types/board';
import { useBoardStore } from '../store/boardStore';
import { useUIStore } from '../store/uiStore';

interface InputFieldProps {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  isDark: boolean;
}

function InputField({ label, value, unit, min, max, step = 1, onChange, isDark }: InputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.02em' }}>{label}</label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
        border: '1px solid var(--color-border)',
      }}>
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          style={{
            flex: 1,
            fontSize: 13,
            background: 'transparent',
            outline: 'none',
            width: '100%',
            color: 'inherit',
          }}
        />
        {unit && <span style={{ fontSize: 11, opacity: 0.5 }}>{unit}</span>}
      </div>
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}

function ColorField({ label, value, onChange, isDark }: ColorFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.02em' }}>{label}</label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        borderRadius: 6,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
        border: '1px solid var(--color-border)',
      }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            cursor: 'pointer',
            border: 'none',
            padding: 0,
            background: 'none',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            fontSize: 12,
            background: 'transparent',
            outline: 'none',
            textTransform: 'uppercase',
            color: 'inherit',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.5,
  marginBottom: 4,
};

export default function PropertyPanel() {
  const showPropertyPanel = useUIStore((s) => s.showPropertyPanel);
  const togglePropertyPanel = useUIStore((s) => s.togglePropertyPanel);
  const selectedElementId = useBoardStore((s) => s.selectedElementId);
  const getActiveBoard = useBoardStore((s) => s.getActiveBoard);
  const updateElement = useBoardStore((s) => s.updateElement);
  const removeElement = useBoardStore((s) => s.removeElement);
  const bringToFront = useBoardStore((s) => s.bringToFront);
  const sendToBack = useBoardStore((s) => s.sendToBack);
  const moveUp = useBoardStore((s) => s.moveUp);
  const moveDown = useBoardStore((s) => s.moveDown);
  const themeName = useUIStore((s) => s.themeName);

  const [element, setElement] = useState<BoardElement | null>(null);
  const boards = useBoardStore((s) => s.boards);
  const isDark = themeName === 'dark';

  useEffect(() => {
    if (!selectedElementId) {
      setElement(null);
      return;
    }
    const board = getActiveBoard();
    const found = board?.elements.find((e) => e.id === selectedElementId) || null;
    setElement(found ? { ...found } : null);
  }, [selectedElementId, getActiveBoard, boards]);

  const handleUpdate = (updates: Partial<BoardElement>) => {
    if (!element) return;
    setElement({ ...element, ...updates } as BoardElement);
    updateElement(element.id, updates);
  };

  const handleRemove = () => {
    if (!element) return;
    removeElement(element.id);
    togglePropertyPanel(false);
  };

  const handleResetImageRatio = () => {
    if (!element || element.type !== 'image') return;
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const newHeight = element.width / ratio;
      handleUpdate({ height: newHeight });
    };
    img.src = element.src;
  };

  if (!showPropertyPanel) return null;

  const panelBg = isDark ? 'var(--color-glass-dark)' : 'var(--color-glass)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';

  return (
    <aside
      style={{
        position: 'fixed',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: panelBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        right: 0,
        top: 0,
        height: '100%',
        width: 'var(--panel-width)',
        animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}
      className="property-panel"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>属性</h3>
        <button
          onClick={() => togglePropertyPanel(false)}
          style={{
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {!element ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          opacity: 0.5,
          padding: 24,
          textAlign: 'center',
        }}>
          请选择画布上的元素查看属性
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={sectionTitleStyle}>位置</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="X" value={element.x} unit="px" onChange={(v) => handleUpdate({ x: v })} isDark={isDark} />
              <InputField label="Y" value={element.y} unit="px" onChange={(v) => handleUpdate({ y: v })} isDark={isDark} />
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={sectionTitleStyle}>大小</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="宽度" value={element.width} unit="px" min={1} onChange={(v) => handleUpdate({ width: v })} isDark={isDark} />
              <InputField label="高度" value={element.height} unit="px" min={1} onChange={(v) => handleUpdate({ height: v })} isDark={isDark} />
            </div>
            {element.type === 'image' && (
              <button
                onClick={handleResetImageRatio}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: inputBg,
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  transition: 'background-color var(--transition-fast)',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = inputBg;
                }}
              >
                <RotateCw size={14} />
                恢复原图比例
              </button>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={sectionTitleStyle}>变换</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="旋转" value={element.rotation} unit="°" min={-360} max={360} onChange={(v) => handleUpdate({ rotation: v })} isDark={isDark} />
              <InputField label="透明度" value={element.opacity} min={0} max={1} step={0.05} onChange={(v) => handleUpdate({ opacity: v })} isDark={isDark} />
            </div>
          </section>

          {element.type === 'shape' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={sectionTitleStyle}>形状</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ColorField label="填充色" value={element.fillColor} onChange={(v) => handleUpdate({ fillColor: v })} isDark={isDark} />
                <ColorField label="边框色" value={element.strokeColor} onChange={(v) => handleUpdate({ strokeColor: v })} isDark={isDark} />
                <InputField label="线宽" value={element.strokeWidth} unit="px" min={0} max={50} onChange={(v) => handleUpdate({ strokeWidth: v })} isDark={isDark} />
              </div>
            </section>
          )}

          {element.type === 'path' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={sectionTitleStyle}>路径</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ColorField label="颜色" value={element.strokeColor} onChange={(v) => handleUpdate({ strokeColor: v })} isDark={isDark} />
                <InputField label="线宽" value={element.strokeWidth} unit="px" min={1} max={50} onChange={(v) => handleUpdate({ strokeWidth: v })} isDark={isDark} />
              </div>
            </section>
          )}

          {element.type === 'text' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={sectionTitleStyle}>文本</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.02em' }}>内容</label>
                  <textarea
                    value={element.text}
                    onChange={(e) => handleUpdate({ text: e.target.value })}
                    rows={3}
                    style={{
                      fontSize: 13,
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: inputBg,
                      border: '1px solid var(--color-border)',
                      resize: 'none',
                      outline: 'none',
                      color: 'inherit',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <InputField label="字号" value={element.fontSize} unit="px" min={8} max={200} onChange={(v) => handleUpdate({ fontSize: v })} isDark={isDark} />
                <ColorField label="颜色" value={element.color} onChange={(v) => handleUpdate({ color: v })} isDark={isDark} />
              </div>
            </section>
          )}

          <section style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--color-border)',
          }}>
            <h4 style={sectionTitleStyle}>层级</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: ArrowUpToLine, label: '置顶', action: () => bringToFront(element.id) },
                { icon: ArrowDownToLine, label: '置底', action: () => sendToBack(element.id) },
                { icon: ArrowUp, label: '上移', action: () => moveUp(element.id) },
                { icon: ArrowDown, label: '下移', action: () => moveDown(element.id) },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    borderRadius: 8,
                    background: inputBg,
                    border: '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = inputBg;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  title={label}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: 10 }}>{label}</span>
                </button>
              ))}
            </div>
          </section>

          <section style={{
            paddingTop: 8,
            borderTop: '1px solid var(--color-border)',
          }}>
            <button
              onClick={handleRemove}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 8,
                width: '100%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
            >
              <Trash2 size={16} />
              删除元素
            </button>
          </section>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .property-panel {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 40vh !important;
            border-left: none !important;
            border-top: 1px solid var(--color-border) !important;
            border-radius: 16px 16px 0 0 !important;
            animation: slideInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          }
        }
      `}</style>
    </aside>
  );
}
