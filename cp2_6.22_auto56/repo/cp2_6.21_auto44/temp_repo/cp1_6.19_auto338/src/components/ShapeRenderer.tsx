import React from 'react';
import { motion } from 'framer-motion';
import { BoardElement } from '@/types';

interface ShapeRendererProps {
  element: BoardElement;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ element }) => {
  const { type, width, height, fill, stroke, strokeWidth, opacity } = element;

  const commonProps = {
    fill,
    stroke,
    strokeWidth,
    opacity,
    style: { transformOrigin: 'center' },
  };

  const renderShape = () => {
    switch (type) {
      case 'rectangle':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={4}
            {...commonProps}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={(width - strokeWidth) / 2}
            ry={(height - strokeWidth) / 2}
            {...commonProps}
          />
        );
      case 'triangle': {
        const points = `${width / 2},${strokeWidth / 2} ${width - strokeWidth / 2},${height - strokeWidth / 2} ${strokeWidth / 2},${height - strokeWidth / 2}`;
        return <polygon points={points} {...commonProps} />;
      }
      case 'hexagon': {
        const cx = width / 2;
        const cy = height / 2;
        const r = (Math.min(width, height) - strokeWidth) / 2;
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * Math.PI) / 3 - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={points} {...commonProps} />;
      }
      case 'star': {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = (Math.min(width, height) - strokeWidth) / 2;
        const innerR = outerR * 0.4;
        const points = Array.from({ length: 10 }, (_, i) => {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={points} {...commonProps} />;
      }
      case 'text': {
        const textContent = element.text || '双击编辑';
        const fontSize = element.fontSize || 24;
        const fontFamily = element.fontFamily || 'Inter, sans-serif';
        return (
          <text
            x={width / 2}
            y={height / 2 + fontSize / 3}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={fill}
            fontSize={fontSize}
            fontFamily={fontFamily}
            opacity={opacity}
            style={{ userSelect: 'none', fontWeight: 600 }}
          >
            {textContent}
          </text>
        );
      }
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={width}
      height={height}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {renderShape()}
    </motion.svg>
  );
};
