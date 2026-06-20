import { useState } from 'react';
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Images,
} from 'lucide-react';
import type { Tool } from '../types/board';
import { useUIStore } from '../store/uiStore';
import { useBoardStore } from '../store/boardStore';

const tools: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'pen', icon: Pencil, label: '画笔' },
  { id: 'rectangle', icon: Square, label: '矩形' },
  { id: 'ellipse', icon: Circle, label: '圆形' },
  { id: 'text', icon: Type, label: '文本' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦' },
];

const presetColors = [
  '#2196F3',
  '#FF5252',
  '#4CAF50',
  '#FFC107',
  '#9C27B0',
  '#00BCD4',
  '#FF6F00',
  '#2d3436',
];

export default function Toolbar() {
  const currentTool = useUIStore((s) => s.currentTool);
  const currentColor = useUIStore((s) => s.currentColor);
  const currentStrokeWidth = useUIStore((s) => s.currentStrokeWidth);
  const themeName = useUIStore((s) => s.themeName);
  const showAssetLibrary = useUIStore((s) => s.showAssetLibrary);
  const setTool = useUIStore((s) => s.setTool);
  const setColor = useUIStore((s) => s.setColor);
  const setStrokeWidth = useUIStore((s) => s.setStrokeWidth);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleAssetLibrary = useUIStore((s) => s.toggleAssetLibrary);

  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const canUndo = useBoardStore((s) => s.canUndo);
  const canRedo = useBoardStore((s) => s.canRedo);

  const [undoAnimating, setUndoAnimating] = useState(false);
  const [redoAnimating, setRedoAnimating] = useState(false);

  const handleUndo = () => {
    if (!canUndo()) return;
    setUndoAnimating(true);
    undo();
    setTimeout(() => setUndoAnimating(false), 300);
  };

  const handleRedo = () => {
    if (!canRedo()) return;
    setRedoAnimating(true);
    redo();
    setTimeout(() => setRedoAnimating(false), 300);
  };

  const isDark = themeName === 'dark';

  return (
    <div
      className="toolbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--toolbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: 16,
        zIndex: 100,
        background: isDark ? 'var(--color-glass-dark)' : 'var(--color-glass)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {tools.map(({ id, icon: Icon, label }) => {
          const isActive = currentTool === id;
          return (
            <button
              key={id}
              title={label}
              onClick={() => setTool(id)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                background: isActive
                  ? 'var(--color-primary)'
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : 'inherit',
                animation: isActive ? 'bounce 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(33, 150, 243, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1.05)';
              }}
            >
              <Icon size={20} strokeWidth={2} />
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
        >
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              title={color}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: color,
                border: currentColor === color ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
            />
          ))}
          <label
            title="自定义颜色"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
              border: currentColor && !presetColors.includes(currentColor) ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setColor(e.target.value)}
              style={{
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'absolute',
              }}
            />
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: 'nowrap' }}>线宽</span>
          <input
            type="range"
            min={1}
            max={20}
            value={currentStrokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: currentStrokeWidth,
                height: currentStrokeWidth,
                borderRadius: '50%',
                background: currentColor,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <button
            onClick={handleUndo}
            disabled={!canUndo()}
            title="撤销"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canUndo() ? 1 : 0.35,
              transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
              transform: undoAnimating ? 'rotate(-180deg)' : 'rotate(0deg)',
            }}
            onMouseEnter={(e) => {
              if (canUndo()) {
                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.15)';
                e.currentTarget.style.transform = undoAnimating ? 'rotate(-180deg) scale(1.05)' : 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = undoAnimating ? 'rotate(-180deg) scale(1)' : 'scale(1)';
            }}
            onMouseDown={(e) => {
              if (canUndo()) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            <Undo2 size={20} strokeWidth={2} />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo()}
            title="重做"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canRedo() ? 1 : 0.35,
              transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
              transform: redoAnimating ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            onMouseEnter={(e) => {
              if (canRedo()) {
                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.15)';
                e.currentTarget.style.transform = redoAnimating ? 'rotate(180deg) scale(1.05)' : 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = redoAnimating ? 'rotate(180deg) scale(1)' : 'scale(1)';
            }}
            onMouseDown={(e) => {
              if (canRedo()) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            <Redo2 size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <button
          onClick={toggleAssetLibrary}
          title="素材库"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showAssetLibrary ? 'rgba(33, 150, 243, 0.15)' : 'transparent',
            color: showAssetLibrary ? 'var(--color-primary)' : 'inherit',
            transition: 'transform var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!showAssetLibrary) {
              e.currentTarget.style.background = 'rgba(33, 150, 243, 0.15)';
            }
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            if (!showAssetLibrary) {
              e.currentTarget.style.background = 'transparent';
            }
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
        >
          <Images size={20} strokeWidth={2} />
        </button>

        <button
          onClick={toggleTheme}
          title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(33, 150, 243, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
        >
          {isDark ? (
            <Sun size={20} strokeWidth={2} />
          ) : (
            <Moon size={20} strokeWidth={2} />
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .toolbar {
            top: auto !important;
            bottom: 0 !important;
            border-top: ${isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'} !important;
            border-bottom: none !important;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid ${isDark ? 'var(--color-bg-dark)' : 'var(--color-bg)'};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid ${isDark ? 'var(--color-bg-dark)' : 'var(--color-bg)'};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
