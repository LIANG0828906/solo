import React, { useState, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { PRESET_SCHEMES, ANCIENT_COLORS } from './utils/colorUtils';
import type { ColorScheme } from './utils/colorUtils';
import * as htmlToImage from 'html-to-image';
import type { HistoryRecord } from './store/useAppStore';

export default function PalettePanel() {
  const {
    currentScheme,
    customPalette,
    applyScheme,
    setCustomPaletteSlot,
    addHistory,
    elements,
    fanShape,
    setIsBreathing,
  } = useAppStore();

  const [draggedColor, setDraggedColor] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [animatingSchemes, setAnimatingSchemes] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSchemeClick = async (scheme: ColorScheme) => {
    if (animatingSchemes.has(scheme.id)) return;

    setAnimatingSchemes((prev) => new Set(prev).add(scheme.id));
    applyScheme(scheme);
    setIsBreathing(true);

    setTimeout(() => {
      setIsBreathing(false);
    }, 4000);

    setTimeout(() => {
      captureAndSaveHistory(scheme);
    }, 800);

    setTimeout(() => {
      setAnimatingSchemes((prev) => {
        const next = new Set(prev);
        next.delete(scheme.id);
        return next;
      });
    }, 500);
  };

  const captureAndSaveHistory = async (scheme: ColorScheme) => {
    const wrapper = document.getElementById('fan-canvas-wrapper');
    if (!wrapper) return;

    try {
      const dataUrl = await htmlToImage.toPng(wrapper, {
        width: 120,
        height: 120,
        style: {
          transform: 'scale(0.2)',
          transformOrigin: 'top left',
        },
      });

      const record: HistoryRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        thumbnail: dataUrl,
        scheme,
        elements: JSON.parse(JSON.stringify(elements)),
        fanShape,
      };

      addHistory(record);
    } catch (err) {
      console.error('Failed to capture thumbnail:', err);
    }
  };

  const handleDragStart = (color: string, e: React.MouseEvent) => {
    setDraggedColor(color);
    setDragPosition({ x: e.clientX, y: e.clientY });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setDragPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (panelRef.current) {
        const slots = panelRef.current.querySelectorAll('.custom-palette-slot');
        slots.forEach((slot, index) => {
          const rect = slot.getBoundingClientRect();
          if (
            upEvent.clientX >= rect.left &&
            upEvent.clientX <= rect.right &&
            upEvent.clientY >= rect.top &&
            upEvent.clientY <= rect.bottom
          ) {
            setCustomPaletteSlot(index, draggedColor || '');
          }
        });
      }
      setDraggedColor(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCustomColorClick = (color: string) => {
    if (!color) return;
    const scheme: ColorScheme = {
      id: `custom-${Date.now()}`,
      name: '自定义',
      colors: [color, ...currentScheme.colors.slice(1)],
    };
    handleSchemeClick(scheme);
  };

  return (
    <div
      ref={panelRef}
      className="palette-panel"
      style={{
        width: '320px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(139,90,43,0.12)',
        fontFamily: 'serif',
      }}
    >
      <h2
        style={{
          fontSize: '18px',
          color: '#8B4513',
          margin: '0 0 16px 0',
          fontWeight: '600',
          borderBottom: '1px solid rgba(139,69,19,0.15)',
          paddingBottom: '8px',
        }}
      >
        配色方案
      </h2>

      <div
        style={{
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            color: '#8B4513',
            margin: '0 0 12px 0',
            fontWeight: '500',
          }}
        >
          推荐配色
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          {PRESET_SCHEMES.map((scheme) => (
            <div
              key={scheme.id}
              className="preset-scheme"
              onClick={() => handleSchemeClick(scheme)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '10px',
                background: currentScheme.id === scheme.id ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.5)',
                border: currentScheme.id === scheme.id ? '1px solid #FFD700' : '1px solid rgba(139,69,19,0.1)',
                boxShadow: currentScheme.id === scheme.id ? '0 0 8px rgba(255,215,0,0.3)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(139,90,43,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = currentScheme.id === scheme.id
                  ? '0 0 8px rgba(255,215,0,0.3)'
                  : 'none';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '3px',
                  marginBottom: '8px',
                }}
              >
                {scheme.colors.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      backgroundColor: color,
                      border: '1px solid rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      transitionDelay: `${colorIndex * 0.1}s`,
                      transform: animatingSchemes.has(scheme.id) ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  color: '#8B4513',
                  fontWeight: '500',
                }}
              >
                {scheme.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            color: '#8B4513',
            margin: '0 0 12px 0',
            fontWeight: '500',
          }}
        >
          古风色板
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '6px',
          }}
        >
          {ANCIENT_COLORS.map((c) => (
            <div
              key={c.hex}
              title={c.name}
              onMouseDown={(e) => handleDragStart(c.hex, e)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: c.hex,
                cursor: 'grab',
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 2px 4px rgba(139,90,43,0.15)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLDivElement).style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLDivElement).style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(139,69,19,0.6)',
            margin: '8px 0 0 0',
            fontStyle: 'italic',
          }}
        >
          拖拽颜色到下方调色盘
        </p>
      </div>

      <div>
        <h3
          style={{
            fontSize: '14px',
            color: '#8B4513',
            margin: '0 0 12px 0',
            fontWeight: '500',
          }}
        >
          自定义调色盘
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {customPalette.map((color, index) => (
            <div
              key={index}
              className="custom-palette-slot"
              onClick={() => handleCustomColorClick(color)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: color || 'rgba(139,69,19,0.05)',
                border: color ? `2px solid ${currentScheme.colors[0] === color ? '#FFD700' : 'rgba(139,69,19,0.2)'}` : '2px dashed rgba(139,69,19,0.2)',
                boxShadow: currentScheme.colors.includes(color)
                  ? '0 0 8px rgba(255,215,0,0.6), inset 0 0 4px rgba(255,215,0,0.3)'
                  : 'none',
                cursor: color ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (color) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              {!color && (
                <span
                  style={{
                    fontSize: '20px',
                    color: 'rgba(139,69,19,0.3)',
                  }}
                >
                  +
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {draggedColor && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x - 18,
            top: dragPosition.y - 18,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: draggedColor,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 12px rgba(139,90,43,0.3)',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.9,
          }}
        />
      )}
    </div>
  );
}
