import { memo } from 'react';
import type { ShapeType } from '../store';
import { getShapePath } from '../utils/transform';

interface ShapeIconProps {
  shape: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number;
}

const ShapeIconImpl = ({
  shape,
  fill = '#d4884a',
  stroke = '#8b4513',
  strokeWidth = 1.5,
  size = 24
}: ShapeIconProps) => {
  const half = size / 2;
  const scale = size / 50;

  if (shape === 'circle') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`}>
        <circle cx={0} cy={0} r={half - 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (shape === 'ellipse') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`}>
        <ellipse
          cx={0}
          cy={0}
          rx={half - 2}
          ry={(half - 2) * 0.55}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (shape === 'ring') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`}>
        <circle
          cx={0}
          cy={0}
          r={half - 2}
          fill="none"
          stroke={stroke}
          strokeWidth={Math.max(3, strokeWidth * 2)}
        />
      </svg>
    );
  }

  const path = getShapePath(shape);

  return (
    <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`}>
      <g transform={`scale(${scale})`}>
        <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

export const ShapeIcon = memo(ShapeIconImpl);
