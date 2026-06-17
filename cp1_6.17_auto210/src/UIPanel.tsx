import { useState } from 'react';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#F5A623', '#D9534F', '#7B68EE', '#FFD700'
];

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

function ColorPalette({ selectedColor, onColorChange }: ColorPaletteProps) {
  const [animatingColor, setAnimatingColor] = useState<string | null>(null);

  const handleColorClick = (color: string) => {
    onColorChange(color);
    setAnimatingColor(color);
    setTimeout(() => setAnimatingColor(null), 300);
  };

  return (
    <div
      style={{
        width: '60px',
        background: '#1A1A1A',
        borderRadius: '8px',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => handleColorClick(color)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: color,
            border: `2px solid ${selectedColor === color ? '#FFFFFF' : '#333333'}`,
            cursor: 'pointer',
            position: 'relative',
            transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
            boxShadow: animatingColor === color
              ? `0 0 0 2px #FFFFFF, 0 0 15px ${color}`
              : selectedColor === color
              ? `0 0 0 2px #FFFFFF`
              : 'none',
            animation: animatingColor === color ? 'pulse 0.3s ease-out' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

interface BrushControlProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

function BrushControl({ brushSize, onBrushSizeChange }: BrushControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 12px',
        background: '#1A1A1A',
        borderRadius: '8px',
        marginTop: '12px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#FFFFFF',
          marginBottom: '10px',
          fontWeight: 500,
        }}
      >
        {brushSize}px
      </div>
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '4px',
          background: '#333333',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${((brushSize - 5) / 25) * 100}%`,
            background: 'linear-gradient(90deg, #4A00E0, #8E2DE2)',
            borderRadius: '2px',
          }}
        />
        <input
          type="range"
          min="5"
          max="30"
          step="1"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            transform: 'translateY(-50%)',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #FFFFFF;
            cursor: pointer;
            transition: transform 0.2s ease-out;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #FFFFFF;
            cursor: pointer;
            border: none;
            transition: transform 0.2s ease-out;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
          input[type="range"]:focus {
            outline: none;
          }
        `}</style>
      </div>
    </div>
  );
}

interface UIPanelProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onExport: () => void;
  canUndo: boolean;
}

export default function UIPanel({
  selectedColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  onUndo,
  onExport,
  canUndo,
}: UIPanelProps) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <ColorPalette
          selectedColor={selectedColor}
          onColorChange={onColorChange}
        />
        <BrushControl
          brushSize={brushSize}
          onBrushSizeChange={onBrushSizeChange}
        />
      </div>

      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
        }}
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: canUndo ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease-out, transform 0.2s ease-out',
            opacity: canUndo ? 1 : 0.4,
          }}
          onMouseEnter={(e) => {
            if (canUndo) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = canUndo ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="撤销"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ECDC4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </button>

        <button
          onClick={onClear}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease-out, transform 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="清理画布"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <button
        onClick={onExport}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '120px',
          height: '40px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #4A00E0, #8E2DE2)',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 10,
          transition: 'box-shadow 0.2s ease-out, transform 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 15px rgba(74,0,224,0.6)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        导出
      </button>
    </>
  );
}
