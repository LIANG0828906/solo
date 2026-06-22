import React, { useState, useCallback } from 'react';
import {
  Circle,
  Flower2,
  Sparkles,
  Waves,
  Undo2,
  Redo2,
  Download
} from 'lucide-react';
import type { BrushType } from '@/utils/geometry';
import { useCanvasStore } from '@/hooks/useCanvas';

interface ToolbarProps {
  onExport: () => void;
  isExporting: boolean;
}

interface BrushButtonProps {
  type: BrushType;
  label: string;
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const BrushButton: React.FC<BrushButtonProps> = ({ type, label, active, onClick, Icon }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(79, 195, 247, 0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease, transform 0.2s ease',
        color: '#ECEFF1'
      }}
      className="toolbar-brush-btn"
    >
      <Icon size={22} strokeWidth={1.8} />
      {active && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#4CAF50',
            boxShadow: '0 0 4px rgba(76, 175, 80, 0.8)',
            transition: 'opacity 0.2s ease, transform 0.2s ease'
          }}
        />
      )}
    </button>
  );
};

const brushes: { type: BrushType; label: string; Icon: BrushButtonProps['Icon'] }[] = [
  { type: 'dot', label: '基础圆点', Icon: Circle },
  { type: 'petal', label: '花瓣形', Icon: Flower2 },
  { type: 'star', label: '星芒形', Icon: Sparkles },
  { type: 'wave', label: '波浪形', Icon: Waves }
];

const Toolbar: React.FC<ToolbarProps> = ({ onExport, isExporting }) => {
  const { brush, symmetry, setBrush, setSymmetry, undo, redo, paths, redoStack } = useCanvasStore();
  const [flash, setFlash] = useState(false);

  const handleExport = useCallback(() => {
    onExport();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  }, [onExport]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#263238',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease'
      }}
      className="toolbar-main"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flex: 1
        }}
        className="toolbar-left"
      >
        <div
          style={{
            color: '#ECEFF1',
            fontWeight: 700,
            fontSize: 16,
            fontFamily: '"Noto Sans SC", sans-serif',
            whiteSpace: 'nowrap',
            marginRight: 8
          }}
          className="toolbar-title"
        >
          几何花纹工坊
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8
          }}
          className="brush-group"
        >
          {brushes.map(b => (
            <BrushButton
              key={b.type}
              type={b.type}
              label={b.label}
              active={brush === b.type}
              onClick={() => setBrush(b.type)}
              Icon={b.Icon}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            height: 40,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8
          }}
          className="symmetry-group"
        >
          <span
            style={{
              color: '#ECEFF1',
              fontSize: 13,
              fontFamily: '"Noto Sans SC", sans-serif',
              whiteSpace: 'nowrap'
            }}
          >
            对称数
          </span>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={symmetry}
            onChange={e => setSymmetry(parseInt(e.target.value, 10))}
            style={{
              width: 140,
              height: 4,
              accentColor: '#4FC3F7',
              cursor: 'pointer'
            }}
          />
          <span
            style={{
              color: '#4FC3F7',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'Roboto, monospace',
              minWidth: 24,
              textAlign: 'center'
            }}
          >
            {symmetry}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
        className="toolbar-right"
      >
        <button
          type="button"
          onClick={undo}
          disabled={paths.length === 0}
          title="撤销 (Ctrl+Z)"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            cursor: paths.length === 0 ? 'not-allowed' : 'pointer',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: paths.length === 0 ? 'rgba(236, 239, 241, 0.3)' : '#ECEFF1',
            transition: 'all 0.2s ease',
            opacity: paths.length === 0 ? 0.4 : 1
          }}
        >
          <Undo2 size={20} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="重做 (Ctrl+Shift+Z)"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: redoStack.length === 0 ? 'rgba(236, 239, 241, 0.3)' : '#ECEFF1',
            transition: 'all 0.2s ease',
            opacity: redoStack.length === 0 ? 0.4 : 1
          }}
        >
          <Redo2 size={20} strokeWidth={1.8} />
        </button>

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} className="toolbar-divider" />

        <button
          type="button"
          onClick={handleExport}
          title="导出SVG"
          style={{
            height: 40,
            padding: '0 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: flash ? '#4CAF50' : '#4FC3F7',
            color: '#263238',
            fontWeight: 600,
            fontSize: 13,
            fontFamily: '"Noto Sans SC", sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            boxShadow: flash ? '0 0 12px rgba(76, 175, 80, 0.7)' : 'none',
            transform: flash ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Download size={18} strokeWidth={2} />
          <span className="export-label">导出SVG</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
