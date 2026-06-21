import React, { useState, useEffect } from 'react';
import type { PaletteColors } from './types';

interface PreviewSectionProps {
  palette: PaletteColors | null;
}

type ThemeMode = 'light' | 'dark';

const PreviewSection: React.FC<PreviewSectionProps> = ({ palette }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [transitioning, setTransitioning] = useState(false);
  const [displayMode, setDisplayMode] = useState<ThemeMode>('light');

  const handleModeToggle = (next: ThemeMode) => {
    if (next === mode) return;
    setMode(next);
    setTransitioning(true);
    setTimeout(() => {
      setDisplayMode(next);
    }, 80);
  };

  const isDark = displayMode === 'dark';

  const defaultPalette: PaletteColors = {
    primary: '#FF6B6B',
    accent1: '#FFD93D',
    accent2: '#6BCB77',
    accent3: '#4D96FF',
    gradient: ['#FF6B6B', '#FFD93D']
  };

  const p = palette || defaultPalette;

  const bgColor = isDark ? '#1A1A2E' : '#F5F5F5';
  const cardBg = isDark ? '#252540' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#222222';
  const textMuted = isDark ? '#9999AA' : '#777777';
  const borderColor = isDark ? '#3A3A55' : '#E5E5E5';

  return (
    <div
      style={{
        width: '100%',
        height: 180,
        background: '#F5F5F5',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        borderTop: '1px solid #E8E0D0'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 5
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
          应用场景预览
        </span>
        <div style={{
          display: 'flex',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #DDD',
          background: '#FFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <button
            onClick={() => handleModeToggle('light')}
            style={{
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: mode === 'light' ? 700 : 500,
              background: mode === 'light' ? p.primary : 'transparent',
              color: mode === 'light' ? '#FFF' : '#555',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            浅色
          </button>
          <button
            onClick={() => handleModeToggle('dark')}
            style={{
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: mode === 'dark' ? 700 : 500,
              background: mode === 'dark' ? p.primary : 'transparent',
              color: mode === 'dark' ? '#FFF' : '#555',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            深色
          </button>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 14,
          background: bgColor,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          transition: 'background 0.4s linear',
          paddingTop: 50,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${p.gradient[0]}15 0%, ${p.gradient[1]}15 100%)`,
            opacity: isDark ? 0.3 : 0.7,
            transition: 'opacity 0.4s linear'
          }}
        />

        <div
          style={{
            width: '40%',
            height: '100%',
            borderRadius: 12,
            background: cardBg,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark
              ? '0 4px 16px rgba(0,0,0,0.3)'
              : '0 4px 16px rgba(0,0,0,0.06)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'all 0.4s linear',
            zIndex: 2,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
            flexShrink: 0
          }} />
          <div style={{
            width: '75%',
            height: 12,
            borderRadius: 4,
            background: textColor,
            opacity: isDark ? 0.85 : 0.9,
            transition: 'all 0.4s linear'
          }} />
          <div style={{
            width: '100%',
            height: 8,
            borderRadius: 3,
            background: textMuted,
            opacity: isDark ? 0.5 : 0.55,
            transition: 'all 0.4s linear'
          }} />
          <div style={{
            width: '60%',
            height: 8,
            borderRadius: 3,
            background: textMuted,
            opacity: isDark ? 0.4 : 0.45,
            transition: 'all 0.4s linear'
          }} />
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            gap: 6
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: p.accent1
            }} />
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: p.accent2
            }} />
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: p.accent3
            }} />
          </div>
        </div>

        <div
          style={{
            width: '30%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 2
          }}
        >
          <button
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: 10,
              border: 'none',
              background: p.primary,
              color: '#FFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 3px 10px ${p.primary}50`,
              letterSpacing: 0.5
            }}
          >
            主要操作
          </button>
          <button
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: 10,
              border: `1.5px solid ${p.accent2}`,
              background: 'transparent',
              color: p.accent2,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            次要操作
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: p.accent1
            }} />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              <div style={{
                width: 70,
                height: 8,
                borderRadius: 3,
                background: textColor,
                opacity: 0.8
              }} />
              <div style={{
                width: 50,
                height: 6,
                borderRadius: 2,
                background: textMuted,
                opacity: 0.5
              }} />
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 8,
            zIndex: 2
          }}
        >
          {[p.primary, p.accent1, p.accent2, p.accent3].map((c, i) => (
            <div
              key={i}
              style={{
                height: 14,
                borderRadius: 5,
                background: `linear-gradient(90deg, ${c}30, ${c}08)`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${35 + i * 15}%`,
                  background: c,
                  borderRadius: 5
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewSection;
