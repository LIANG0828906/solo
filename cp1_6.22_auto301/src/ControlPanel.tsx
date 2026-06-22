import React, { useCallback } from 'react';
import { clamp } from './utils';

interface ControlPanelProps {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = function ControlPanel({
  zoomLevel,
  onZoomChange,
  onReset,
}) {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onZoomChange(clamp(value, 0.5, 2));
  }, [onZoomChange]);

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReset();
  }, [onReset]);

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(44, 44, 44, 0.88)',
    borderRadius: '12px',
    padding: '16px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily: 'Georgia, serif',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    minWidth: '200px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#D2B48C',
    margin: 0,
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#E8D4B8',
    marginLeft: '8px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const sliderStyle: React.CSSProperties = {
    width: '200px',
    height: '6px',
    borderRadius: '8px',
    background: '#555',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#5C4033',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'Georgia, serif',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  };

  const responsiveStyle: React.CSSProperties = {
    '@media (max-width: 768px)': {
      ...panelStyle,
      top: '0',
      left: '0',
      right: '0',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: '0 0 12px 12px',
      minWidth: 'auto',
      padding: '12px 16px',
    },
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const currentPanelStyle: React.CSSProperties = isMobile
    ? {
        ...panelStyle,
        ...(responsiveStyle['@media (max-width: 768px)'] as React.CSSProperties),
      }
    : panelStyle;

  const currentSliderWidth = isMobile ? '120px' : '200px';

  return (
    <div
      style={currentPanelStyle}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div style={sliderContainerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={labelStyle}>缩放</span>
          <span style={valueStyle}>{Math.round(zoomLevel * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={zoomLevel}
          onChange={handleSliderChange}
          style={{
            ...sliderStyle,
            width: currentSliderWidth,
          }}
        />
      </div>
      <button
        style={buttonStyle}
        onClick={handleReset}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#8B4513';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#5C4033';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        重置视图
      </button>
    </div>
  );
};

export default ControlPanel;
