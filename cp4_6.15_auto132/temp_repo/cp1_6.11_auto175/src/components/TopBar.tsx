import type { CanvasSize } from '../types';
import { CANVAS_SIZES } from '../constants';

interface TopBarProps {
  onExportPNG: () => void;
  onResetLayout: () => void;
  onClearCanvas: () => void;
  canvasSize: CanvasSize;
  onCanvasSizeChange: (size: CanvasSize) => void;
}

export const TopBar = ({
  onExportPNG,
  onResetLayout,
  onClearCanvas,
  canvasSize,
  onCanvasSizeChange,
}: TopBarProps) => {
  const buttonStyle = (active = false): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: active ? '#FFE066' : '#4A5568',
    color: active ? '#1A1D21' : '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: '#1F2937',
        borderBottom: '1px solid #374151',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ color: '#E2E8F0', fontSize: '18px', fontWeight: 600 }}>
          黑板菜单设计器
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={canvasSize}
          onChange={(e) => onCanvasSizeChange(e.target.value as CanvasSize)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4A5568',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {Object.entries(CANVAS_SIZES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          <option value="custom">自定义</option>
        </select>

        <button
          onClick={onExportPNG}
          style={buttonStyle()}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A5568';
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#718096';
          }}
        >
          另存为 PNG
        </button>

        <button
          onClick={onResetLayout}
          style={buttonStyle()}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A5568';
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#718096';
          }}
        >
          重新排版
        </button>

        <button
          onClick={onClearCanvas}
          style={buttonStyle()}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A5568';
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#718096';
          }}
        >
          清空画布
        </button>
      </div>
    </div>
  );
};
