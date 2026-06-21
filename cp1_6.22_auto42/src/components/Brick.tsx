import React from 'react';
import type { BrickData } from '@/types';
import { GRID_SIZE, getColorMeta, getSizeMeta, getRotatedDimensions } from '@/constants';

interface BrickProps {
  brick: BrickData;
  selected: boolean;
  onClick: () => void;
  scale: number;
  style?: React.CSSProperties;
  className?: string;
}

const Brick: React.FC<BrickProps> = ({
  brick,
  selected,
  onClick,
  scale,
  style,
  className,
}) => {
  const colorMeta = getColorMeta(brick.color);
  const sizeMeta = getSizeMeta(brick.type);
  const rotated = getRotatedDimensions(brick.type, brick.rotation);

  const widthPx = rotated.w * GRID_SIZE;
  const heightPx = rotated.h * GRID_SIZE;

  const studs: React.ReactNode[] = [];
  const studsX = brick.rotation === 90 || brick.rotation === 270 ? sizeMeta.studsY : sizeMeta.studsX;
  const studsY = brick.rotation === 90 || brick.rotation === 270 ? sizeMeta.studsX : sizeMeta.studsY;

  const studSize = 10 * scale;
  const studSpacingX = widthPx / (studsX + 1);
  const studSpacingY = heightPx / (studsY + 1);

  for (let row = 0; row < studsY; row++) {
    for (let col = 0; col < studsX; col++) {
      const studX = studSpacingX * (col + 1) - studSize / 2;
      const studY = studSpacingY * (row + 1) - studSize / 2 - 2;
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
            boxShadow: `inset 0 -1px 2px ${colorMeta.border}, 0 1px 1px rgba(0,0,0,0.15)`,
            pointerEvents: 'none',
          }}
        />
      );
    }
  }

  const animationClass = brick.deleting
    ? 'brick-delete'
    : brick.justPlaced
    ? 'brick-pop'
    : '';

  const combinedClassName = [className, animationClass].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClassName || undefined}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transform: `translate(${brick.x * GRID_SIZE}px, ${brick.y * GRID_SIZE}px) rotate(${brick.rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        borderRadius: '4px',
        background: `linear-gradient(180deg, ${colorMeta.light} 0%, ${colorMeta.primary} 40%, ${colorMeta.dark} 100%)`,
        border: `2px solid ${colorMeta.border}`,
        boxShadow: selected
          ? `0 0 0 2px #2563eb, 0 0 12px 4px rgba(37, 99, 235, 0.5), inset -2px -4px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.2)`
          : `inset -2px -4px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.15)`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)`,
          borderRadius: '2px 2px 0 0',
          pointerEvents: 'none',
        }}
      />
      {studs}
    </div>
  );
};

export default Brick;
