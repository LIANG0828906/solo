import React, { useState } from 'react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  penThickness: number;
  onPenThicknessChange: (thickness: number) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8C00',
  '#8B4513', '#808080'
];

const THICKNESSES = [2, 4, 6];

const PenIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
);

const RectangleIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
);

const CircleIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const StickyIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
    <path d="M14 3v6h6"/>
  </svg>
);

const UndoIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  penColor,
  onPenColorChange,
  penThickness,
  onPenThicknessChange,
  onUndo,
  canUndo
}) => {
  const [animatingColor, setAnimatingColor] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);

  const handleColorClick = (color: string) => {
    onPenColorChange(color);

    if (animatingColor === color) {
      setAnimatingColor(null);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimatingColor(color);
      });
    });
  };

  const handleAnimationEnd = (color: string) => {
    setAnimatingColor(prev => prev === color ? null : prev);
  };

  const toolButtons: { tool: ToolType; icon: React.FC }[] = [
    { tool: 'pen', icon: PenIcon },
    { tool: 'rectangle', icon: RectangleIcon },
    { tool: 'circle', icon: CircleIcon },
    { tool: 'sticky', icon: StickyIcon },
  ];

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      backgroundColor: 'rgba(44, 44, 44, 0.9)',
      borderRadius: '12px',
      padding: '12px 8px',
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      {toolButtons.map(({ tool, icon: Icon }) => (
        <button
          key={tool}
          onClick={() => {
            onToolChange(currentTool === tool ? 'none' : tool);
            setShowColorPicker(tool === 'pen');
            setShowThicknessPicker(tool === 'pen');
          }}
          onMouseEnter={() => {
            if (tool === 'pen') {
              setShowColorPicker(true);
              setShowThicknessPicker(true);
            }
          }}
          onMouseLeave={() => {
            if (tool === 'pen' && currentTool !== 'pen') {
              setShowColorPicker(false);
              setShowThicknessPicker(false);
            }
          }}
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: currentTool === tool ? '#444' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          <Icon />
        </button>
      ))}

      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          color: canUndo ? 'white' : 'rgba(255,255,255,0.3)',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => canUndo && (e.currentTarget.style.backgroundColor = '#444')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <UndoIcon />
      </button>

      {showThicknessPicker && (
        <div style={{
          position: 'absolute',
          left: '68px',
          top: '12px',
          backgroundColor: 'rgba(44, 44, 44, 0.95)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ color: 'white', fontSize: '12px', marginBottom: '4px' }}>粗细</div>
          {THICKNESSES.map((t) => (
            <button
              key={t}
              onClick={() => onPenThicknessChange(t)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: penThickness === t ? '2px solid white' : '2px solid transparent',
                backgroundColor: penThickness === t ? '#444' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => penThickness !== t && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => penThickness !== t && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{
                width: '20px',
                height: `${t}px`,
                backgroundColor: penColor,
                borderRadius: `${t}px`,
              }} />
            </button>
          ))}
        </div>
      )}

      {showColorPicker && (
        <div style={{
          position: 'absolute',
          left: '140px',
          top: '12px',
          backgroundColor: 'rgba(44, 44, 44, 0.95)',
          borderRadius: '8px',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              className={`color-swatch ${animatingColor === color ? 'color-swatch-active' : ''}`}
              onAnimationEnd={() => handleAnimationEnd(color)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: penColor === color ? '8px' : '6px',
                border: penColor === color ? '3px solid white' : '2px solid transparent',
                backgroundColor: color,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
