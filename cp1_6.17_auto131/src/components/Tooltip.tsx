import React, { useState, useRef, useEffect } from 'react';
import type { SpectralType } from '../types/star';
import { SPECTRAL_COLORS } from '../types/star';
import { cn } from '../lib/utils';

interface TooltipProps {
  spectralType: SpectralType;
  temperature: number;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ spectralType, temperature, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const childRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    setPosition({
      x: e.clientX + 15,
      y: e.clientY + 15
    });
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);

  const displayType = spectralType === 'ALL' ? '混合' : spectralType;
  const color = spectralType !== 'ALL' ? SPECTRAL_COLORS[spectralType] : '#888';

  return (
    <>
      <div
        ref={childRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'fixed z-50 px-3 py-2 rounded pointer-events-none',
            'bg-white text-gray-800 text-sm'
          )}
          style={{
            left: position.x,
            top: position.y,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium">光谱类型: {displayType}</span>
          </div>
          <div className="mt-1">
            温度: {temperature.toLocaleString()} K
          </div>
        </div>
      )}
    </>
  );
};
