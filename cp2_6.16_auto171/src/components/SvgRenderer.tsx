import React, { useMemo } from 'react';
import { Block, ComputedShapeState, ShapeTypes, ShapeParams } from '../types';

interface SvgRendererProps {
  blocks: Block[];
  shapeStates: Map<string, ComputedShapeState>;
}

const renderShapeElement = (
  block: Block,
  state: ComputedShapeState
): JSX.Element => {
  const params = block.params as ShapeParams;
  const baseParams = {
    fill: state.fill,
    opacity: state.opacity,
    style: {
      transition: 'none',
      filter: `drop-shadow(0 4px 12px ${state.fill}40)`
    }
  };

  const transform = `translate(${state.x}, ${state.y}) rotate(${state.rotation}) scale(${state.scale})`;

  switch (block.shapeType) {
    case ShapeTypes.CIRCLE:
      return (
        <circle
          key={block.id}
          cx={0}
          cy={0}
          r={params.radius ?? 40}
          transform={transform}
          {...baseParams}
        />
      );

    case ShapeTypes.RECTANGLE:
      return (
        <rect
          key={block.id}
          x={-(params.width ?? 80) / 2}
          y={-(params.height ?? 60) / 2}
          width={params.width ?? 80}
          height={params.height ?? 60}
          rx={4}
          transform={transform}
          {...baseParams}
        />
      );

    case ShapeTypes.TRIANGLE: {
      const side = params.sideLength ?? 80;
      const h = (side * Math.sqrt(3)) / 2;
      const points = `0,${-h * 0.67} ${-side / 2},${h * 0.33} ${side / 2},${h * 0.33}`;
      return (
        <polygon
          key={block.id}
          points={points}
          transform={transform}
          {...baseParams}
        />
      );
    }

    case ShapeTypes.STAR: {
      const pts = params.points ?? 5;
      const outerR = params.outerRadius ?? 45;
      const innerR = params.innerRadius ?? 20;
      const pointsArr: string[] = [];
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pointsArr.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
      }
      return (
        <polygon
          key={block.id}
          points={pointsArr.join(' ')}
          transform={transform}
          {...baseParams}
        />
      );
    }

    default:
      return <></>;
  }
};

export const SvgRenderer: React.FC<SvgRendererProps> = ({ blocks, shapeStates }) => {
  const shapeBlocks = useMemo(
    () => blocks.filter(b => b.type === 'shape'),
    [blocks]
  );

  const viewBoxSize = 400;
  const centerOffset = viewBoxSize / 2;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className="max-w-[400px] max-h-[400px]"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="previewBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1a1a3e" />
          <stop offset="100%" stopColor="#0f3460" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width={viewBoxSize}
        height={viewBoxSize}
        fill="url(#previewBg)"
        rx="12"
      />
      <rect
        x="0"
        y="0"
        width={viewBoxSize}
        height={viewBoxSize}
        fill="url(#gridPattern)"
        rx="12"
      />

      <g transform={`translate(${centerOffset}, ${centerOffset})`}>
        {shapeBlocks.map(block => {
          const state = shapeStates.get(block.id);
          if (!state) return null;
          return renderShapeElement(block, state);
        })}
      </g>

      {shapeBlocks.length === 0 && (
        <g transform={`translate(${centerOffset}, ${centerOffset})`}>
          <text
            textAnchor="middle"
            y="-10"
            fill="rgba(255,255,255,0.3)"
            fontSize="16"
            fontWeight="600"
          >
            添加形状开始创作
          </text>
          <text
            textAnchor="middle"
            y="18"
            fill="rgba(255,255,255,0.2)"
            fontSize="12"
          >
            从左侧拖入积木块
          </text>
          {[
            { x: -60, y: 50, shape: '●', color: '#e94560' },
            { x: 0, y: 60, shape: '■', color: '#4ecdc4' },
            { x: 60, y: 50, shape: '★', color: '#a855f7' }
          ].map((item, i) => (
            <text
              key={i}
              x={item.x}
              y={item.y}
              textAnchor="middle"
              fill={item.color}
              fontSize="32"
              opacity="0.15"
            >
              {item.shape}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
};
