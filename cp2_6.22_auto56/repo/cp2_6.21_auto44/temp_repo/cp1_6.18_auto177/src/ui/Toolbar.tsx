import React, { useState } from 'react';
import { useBoardStore } from '../stores/boardStore';
import type { ToolType, BrushColor, BrushSize } from '../types';

const BRUSH_COLORS: BrushColor[] = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A29BFE'];
const BRUSH_SIZES: BrushSize[] = [1, 3, 5, 8];

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  width: 80,
  height: '100vh',
  background: '#2D2D44',
  borderRadius: '0 12px 12px 0',
  border: '0.5px solid #3A3A5E',
  borderLeft: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px 0',
  zIndex: 100,
  boxSizing: 'border-box',
  gap: 12,
  userSelect: 'none',
};

const toolButtonStyle = (active: boolean): React.CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: 12,
  background: active ? 'rgba(108,92,231,0.25)' : 'transparent',
  border: active ? '1px solid rgba(108,92,231,0.5)' : '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease',
  position: 'relative',
});

const toolButtonHoverStyle: React.CSSProperties = {
  background: 'rgba(108,92,231,0.15)',
};

const panelStyle = (direction: 'right' | 'bottom'): React.CSSProperties => ({
  position: 'absolute',
  background: '#3A3A5E',
  borderRadius: 10,
  padding: 12,
  display: 'flex',
  flexDirection: direction === 'right' ? 'row' : 'column',
  gap: 8,
  border: '0.5px solid #4A4A70',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  zIndex: 200,
  left: direction === 'right' ? 72 : 'auto',
  top: direction === 'bottom' ? 72 : '50%',
  transform: direction === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
  whiteSpace: 'nowrap',
});

export const Toolbar: React.FC = () => {
  const { currentTool, brushColor, brushSize, setTool, setBrushColor, setBrushSize, addStickyNote, collabRole } = useBoardStore();
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const isDisabled = collabRole === 'viewer';

  const handleToolClick = (tool: ToolType) => {
    if (isDisabled) return;
    if (tool === 'sticky') {
      addStickyNote();
      return;
    }
    setTool(currentTool === tool ? 'none' : tool);
  };

  const renderBrushIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M6 22c2 0 3-1 3-3 0-2-1-3-3-3s-3 1-3 3 1 3 3 3zm3-10l10-10 5 5-10 10-5-5z"
        stroke={currentTool === 'brush' ? '#A29BFE' : '#E0E0F0'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={brushColor}
        fillOpacity="0.3"
      />
    </svg>
  );

  const renderStickyIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect
        x="4"
        y="4"
        width="20"
        height="20"
        rx="3"
        stroke={currentTool === 'sticky' ? '#FFD93D' : '#E0E0F0'}
        strokeWidth="2"
        fill="#FFF9C4"
        fillOpacity="0.3"
      />
      <path d="M18 4v6h6" stroke="#E6DB74" strokeWidth="1.5" />
      <line x1="8" y1="14" x2="18" y2="14" stroke="#2D2D44" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="8" y1="18" x2="16" y2="18" stroke="#2D2D44" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );

  const renderLineIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M5 22c5-2 13-18 18-18"
        stroke={currentTool === 'line' ? '#6C5CE7' : '#E0E0F0'}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="5" cy="22" r="3" fill={currentTool === 'line' ? '#6C5CE7' : '#B2B2D0'} />
      <circle cx="23" cy="4" r="3" fill={currentTool === 'line' ? '#6C5CE7' : '#B2B2D0'} />
    </svg>
  );

  return (
    <div style={toolbarStyle}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="8" cy="8" r="3" stroke="#FFF" strokeWidth="2" />
          <circle cx="16" cy="16" r="3" stroke="#FFF" strokeWidth="2" />
          <path d="M10 9l4 4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ height: 1, width: 48, background: '#3A3A5E', margin: '4px 0 8px' }} />

      <div
        style={{
          ...toolButtonStyle(currentTool === 'brush'),
          ...(hoveredBtn === 'brush' ? toolButtonHoverStyle : {}),
          opacity: isDisabled ? 0.4 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => handleToolClick('brush')}
        onMouseEnter={() => { setHoveredBtn('brush'); setShowColors(currentTool === 'brush'); setShowSizes(false); }}
        onMouseLeave={() => { setHoveredBtn(null); setTimeout(() => setShowColors(false), 200); }}
      >
        {renderBrushIcon()}
        {showColors && (
          <div
            style={panelStyle('right')}
            onMouseEnter={() => setShowColors(true)}
            onMouseLeave={() => setShowColors(false)}
          >
            {BRUSH_COLORS.map((color) => (
              <div
                key={color}
                onClick={(e) => { e.stopPropagation(); setBrushColor(color); }}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: color,
                  border: brushColor === color ? '2px solid #FFF' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  boxShadow: brushColor === color ? `0 0 0 2px ${color}40` : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
            <div style={{ width: 1, background: '#4A4A70', margin: '4px 4px' }} />
            {BRUSH_SIZES.map((size) => (
              <div
                key={size}
                onClick={(e) => { e.stopPropagation(); setBrushSize(size); }}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: brushSize === size ? 'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.05)',
                  border: brushSize === size ? '1px solid #A29BFE' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: size * 2 + 4, height: size * 2 + 4,
                  borderRadius: '50%',
                  background: '#E0E0F0',
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          ...toolButtonStyle(false),
          ...(hoveredBtn === 'sticky' ? toolButtonHoverStyle : {}),
          opacity: isDisabled ? 0.4 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => handleToolClick('sticky')}
        onMouseEnter={() => setHoveredBtn('sticky')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        {renderStickyIcon()}
      </div>

      <div
        style={{
          ...toolButtonStyle(currentTool === 'line'),
          ...(hoveredBtn === 'line' ? toolButtonHoverStyle : {}),
          opacity: isDisabled ? 0.4 : 1,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => handleToolClick('line')}
        onMouseEnter={() => setHoveredBtn('line')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        {renderLineIcon()}
      </div>

      <div style={{ flex: 1 }} />

      {isDisabled && (
        <div style={{
          padding: '6px 10px',
          fontSize: 11,
          color: '#FDCB6E',
          background: 'rgba(253,203,110,0.1)',
          borderRadius: 6,
          textAlign: 'center',
          lineHeight: 1.3,
          margin: '0 8px',
        }}>
          只读模式
        </div>
      )}
    </div>
  );
};
