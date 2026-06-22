import React from 'react';
import { Element } from '../types';
import { ELEMENT_CONFIG } from '../data/molecules';

interface HoverLabelProps {
  atomId: string | null;
  element: Element | null;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export const HoverLabel: React.FC<HoverLabelProps> = ({
  atomId,
  element,
  screenX,
  screenY,
  visible,
}) => {
  if (!visible || !element || !atomId) return null;

  const config = ELEMENT_CONFIG[element];

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-150"
      style={{
        left: screenX + 15,
        top: screenY - 10,
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="relative px-3 py-2 rounded-[6px] text-white text-[12px] whitespace-nowrap"
        style={{ background: 'rgba(30, 30, 40, 0.85)' }}
      >
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-[rgba(30,30,40,0.85)] border-b-4 border-b-transparent" />
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border border-white/30"
            style={{ backgroundColor: config.color }}
          />
          <span className="font-semibold">{config.name}</span>
          <span className="text-[#B0B0C0]">({element})</span>
        </div>
      </div>
    </div>
  );
};
