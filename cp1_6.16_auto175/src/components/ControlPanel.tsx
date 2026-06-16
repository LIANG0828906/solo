import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAQIStore } from '../store/aqiStore';
import type { ViewMode } from '../types';

export const ControlPanel: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const viewMode = useAQIStore((s) => s.viewMode);
  const setViewMode = useAQIStore((s) => s.setViewMode);
  const setActivePreset = useAQIStore((s) => s.setActivePreset);
  const activePreset = useAQIStore((s) => s.activePreset);
  const perspectivePresets = useAQIStore((s) => s.perspectivePresets);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleResetView = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleResetPerspective = () => {
    setActivePreset('全球视角');
  };

  const expandProps = useSpring({
    opacity: isMobile ? (isExpanded ? 1 : 0) : 1,
    maxHeight: isMobile ? (isExpanded ? 500 : 0) : 500,
    overflow: 'hidden',
    config: { tension: 300, friction: 20 },
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: '#0D1117',
        borderRadius: 8,
        padding: 16,
        color: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        border: '1px solid rgba(0,188,212,0.3)',
        minWidth: isMobile ? 'auto' : 200,
        zIndex: 200,
      }}
    >
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00BCD4',
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
            marginBottom: isExpanded ? 8 : 0,
          }}
        >
          {isExpanded ? '✕' : '☰'}
        </button>
      )}

      <animated.div style={expandProps}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: '#8B949E',
              marginBottom: 8,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            视图模式
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ViewButton
              label="柱状图"
              active={viewMode === 'bars'}
              onClick={() => handleResetView('bars')}
            />
            <ViewButton
              label="热力图"
              active={viewMode === 'heatmap'}
              onClick={() => handleResetView('heatmap')}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: '#8B949E',
              marginBottom: 8,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            视角切换
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {perspectivePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setActivePreset(preset.name)}
                style={{
                  background: activePreset === preset.name ? '#00BCD4' : '#424242',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  transition: 'filter 0.2s, background 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleResetPerspective}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#00BCD4',
            border: '1px solid #00BCD4',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 12,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,188,212,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          重置视角
        </button>
      </animated.div>
    </div>
  );
};

interface ViewButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ViewButton: React.FC<ViewButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? '#00BCD4' : '#424242',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 4,
        padding: '6px 8px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 12,
        transition: 'filter 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'brightness(1.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      {label}
    </button>
  );
};
