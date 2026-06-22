
import React, { useEffect, useState } from 'react';
import { useMoleculeStore } from '../store/moleculeStore';
import { ELEMENT_CONFIG } from '../utils/constants';

export const DragPreview: React.FC = () => {
  const draggingElement = useMoleculeStore((s) => s.draggingElement);
  const isOverScene = useMoleculeStore((s) => s.isOverScene);

  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!draggingElement) {
      setVisible(false);
      return;
    }
    setVisible(true);

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [draggingElement]);

  if (!draggingElement || !visible) return null;

  const config = ELEMENT_CONFIG[draggingElement];
  const size = config.radius * 50;
  const borderColor = isOverScene ? '#4ade80' : '#f87171';
  const glowColor = isOverScene ? '#4ade8066' : '#f8717166';

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        transition: 'opacity 0.15s ease',
      }}
    >
      <div
        className="w-full h-full rounded-full relative"
        style={{
          backgroundColor: config.color,
          border: `3px solid ${borderColor}`,
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 20px rgba(255,255,255,0.3)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 55%)',
          }}
        />
      </div>
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap
                   text-[10px] font-bold px-2 py-0.5 rounded"
        style={{
          color: borderColor,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      >
        {isOverScene ? '释放放置' : '移到场景中'}
      </div>
    </div>
  );
};
