import React, { useState, useEffect } from 'react';

interface InfoBarProps {
  moleculeName: string;
  atomCount: number;
  bondCount: number;
  fps: number;
}

export const InfoBar: React.FC<InfoBarProps> = ({
  moleculeName,
  atomCount,
  bondCount,
  fps,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsCollapsed(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const fpsColor = fps < 55 ? '#FF6B6B' : '#4ADE80';

  if (isCollapsed) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-[12px] z-50"
        style={{ background: 'rgba(40, 40, 50, 0.7)' }}
      >
        <span className="text-white text-[13px] font-medium">{moleculeName}</span>
      </div>
    );
  }

  return (
    <div
      className="fixed top-4 left-4 px-4 py-2.5 rounded-[12px] flex items-center gap-6 z-50"
      style={{ background: 'rgba(40, 40, 50, 0.7)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#B0B0C0] text-[12px]">分子:</span>
        <span className="text-white text-[13px] font-medium">{moleculeName}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[#B0B0C0] text-[12px]">原子:</span>
        <span className="text-white text-[13px] font-medium">{atomCount}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[#B0B0C0] text-[12px]">键:</span>
        <span className="text-white text-[13px] font-medium">{bondCount}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[#B0B0C0] text-[12px]">FPS:</span>
        <span className="text-[13px] font-medium" style={{ color: fpsColor }}>
          {fps.toFixed(0)}
        </span>
      </div>
    </div>
  );
};
