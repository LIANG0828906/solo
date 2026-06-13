import React, { useState, useMemo } from 'react';
import { ThemeColors, DerivedColor, generateDerivedColors } from './utils';

interface ColorGridProps {
  colors: ThemeColors;
}

const ColorGrid = React.memo(function ColorGrid({ colors }: ColorGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const derivedColors: DerivedColor[] = useMemo(() => {
    return generateDerivedColors(colors);
  }, [colors]);

  const gridColors = useMemo(() => {
    const base = [
      { name: '主色', value: colors.primary },
      { name: '辅色', value: colors.secondary },
      { name: '背景色', value: colors.background },
      ...derivedColors.slice(0, 6),
    ];
    return base;
  }, [colors, derivedColors]);

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyColor = (color: string, idx: number) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        color: '#e0e0e0',
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 12,
        letterSpacing: '0.5px',
      }}>
        衍生色网格
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        {gridColors.map((color, idx) => (
          <div
            key={color.name}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => copyColor(color.value, idx)}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 10,
              backgroundColor: color.value,
              cursor: 'pointer',
              transform: hoveredIdx === idx ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: hoveredIdx === idx
                ? `0 4px 20px ${color.value}60, 0 0 0 2px rgba(255,255,255,0.1)`
                : `0 2px 8px rgba(0,0,0,0.3)`,
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '6px 8px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              borderRadius: '0 0 10px 10px',
            }}>
              <div style={{ color: '#fff', fontSize: 10, fontWeight: 500, opacity: 0.9 }}>
                {color.name}
              </div>
            </div>

            {hoveredIdx === idx && (
              <div style={{
                position: 'absolute',
                top: -36,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                opacity: 1,
                animation: 'tooltipFadeIn 0.2s ease forwards',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                {color.value.toUpperCase()}
                <div style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(0,0,0,0.85)',
                }} />
              </div>
            )}

            {copiedIdx === idx && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#4ade80',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                pointerEvents: 'none',
              }}>
                已复制
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ColorGrid;
