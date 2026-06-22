import React, { useState } from 'react';
import {
  COLORS_LIST,
  SIZES_LIST,
  getColorMeta,
} from '@/constants';
import type { BrickColor, BrickSize, ColorMeta, SizeMeta } from '@/types';

interface PaletteProps {
  onDragStart: (type: BrickSize, color: BrickColor) => void;
}

const Palette: React.FC<PaletteProps> = ({ onDragStart }) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<BrickColor, boolean>>({
    red: false,
    yellow: false,
    blue: false,
    green: false,
    white: false,
  });

  const toggleGroup = (color: BrickColor) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [color]: !prev[color],
    }));
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    type: BrickSize,
    color: BrickColor
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type, color })
    );
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(type, color);
  };

  const renderBrickThumbnail = (colorMeta: ColorMeta, sizeMeta: SizeMeta) => {
    const cellSize = 12;
    const widthPx = sizeMeta.w * cellSize;
    const heightPx = sizeMeta.h * cellSize;

    const studs: React.ReactNode[] = [];
    const studSize = 5;
    const studSpacingX = widthPx / (sizeMeta.studsX + 1);
    const studSpacingY = heightPx / (sizeMeta.studsY + 1);

    for (let row = 0; row < sizeMeta.studsY; row++) {
      for (let col = 0; col < sizeMeta.studsX; col++) {
        const studX = studSpacingX * (col + 1) - studSize / 2;
        const studY = studSpacingY * (row + 1) - studSize / 2 - 1;
        studs.push(
          <div
            key={`stud-${row}-${col}`}
            style={{
              position: 'absolute',
              left: `${studX}px`,
              top: `${studY}px`,
              width: `${studSize}px`,
              height: `${studSize}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${colorMeta.studHighlight}, ${colorMeta.primary} 60%, ${colorMeta.dark} 100%)`,
              boxShadow: `inset 0 -1px 1px ${colorMeta.border}`,
              pointerEvents: 'none',
            }}
          />
        );
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            borderRadius: '3px',
            background: `linear-gradient(180deg, ${colorMeta.light} 0%, ${colorMeta.primary} 40%, ${colorMeta.dark} 100%)`,
            border: `1px solid ${colorMeta.border}`,
            boxShadow: `inset -1px -2px 0 rgba(0,0,0,0.15), inset 1px 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '35%',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '2px 2px 0 0',
              pointerEvents: 'none',
            }}
          />
          {studs}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100vh',
        overflowY: 'auto',
        background: '#fafbfc',
        borderLeft: '1px solid #e2e8f0',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <div
        style={{
          fontWeight: 500,
          fontSize: '18px',
          marginBottom: '16px',
          color: '#1e293b',
        }}
      >
        零件库
      </div>

      {COLORS_LIST.map((colorMeta) => {
        const isCollapsed = collapsedGroups[colorMeta.key];
        return (
          <div key={colorMeta.key} style={{ marginBottom: '4px' }}>
            <div
              onClick={() => toggleGroup(colorMeta.key)}
              style={{
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                transition: 'background 200ms ease',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: colorMeta.primary,
                  border: `1px solid ${colorMeta.border}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: '#334155',
                }}
              >
                {colorMeta.name}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 200ms ease',
                  display: 'inline-block',
                }}
              >
                ▶
              </span>
            </div>

            <div
              style={{
                maxHeight: isCollapsed ? '0px' : '2000px',
                overflow: 'hidden',
                transition: 'max-height 250ms ease-out',
                paddingLeft: '28px',
                paddingBottom: isCollapsed ? '0px' : '8px',
                paddingTop: isCollapsed ? '0px' : '4px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                {SIZES_LIST.map((sizeMeta) => {
                  const currentColorMeta = getColorMeta(colorMeta.key);
                  return (
                    <div
                      key={sizeMeta.key}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, sizeMeta.key, colorMeta.key)
                      }
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow:
                          '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                        padding: '8px',
                        cursor: 'grab',
                        position: 'relative',
                        transition:
                          'transform 200ms ease, box-shadow 200ms ease',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow =
                          '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)';
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          fontSize: '10px',
                          color: '#94a3b8',
                          opacity: 0.4,
                          lineHeight: 1,
                          letterSpacing: '-1px',
                          userSelect: 'none',
                        }}
                      >
                        ⋮⋮
                      </div>
                      {renderBrickThumbnail(currentColorMeta, sizeMeta)}
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#475569',
                          textAlign: 'center',
                          marginTop: '6px',
                        }}
                      >
                        {sizeMeta.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Palette;
