import React, { useMemo } from 'react';

interface GridOverlayProps {
  visible: boolean;
  width: number;
  height: number;
  gridSize: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ visible, width, height, gridSize }) => {
  const lines = useMemo(() => {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    for (let x = 0; x <= width; x += gridSize) {
      vertical.push(x);
    }
    for (let y = 0; y <= height; y += gridSize) {
      horizontal.push(y);
    }

    return { vertical, horizontal };
  }, [width, height, gridSize]);

  if (!visible) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{
        opacity: 0.4,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {lines.vertical.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#dcdcdc"
          strokeWidth="1"
        />
      ))}
      {lines.horizontal.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#dcdcdc"
          strokeWidth="1"
        />
      ))}
      {lines.vertical.map((x) =>
        lines.horizontal.map((y) => (
          <circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r="2"
            fill="#dcdcdc"
          />
        ))
      )}
    </svg>
  );
};
