import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useStarStore } from '../store/useStarStore';

export const EvolutionProgress: React.FC = () => {
  const { evolutionProgress, setEvolutionProgress, evolutionPath } = useStarStore();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = evolutionPath.length > 0 
    ? Math.min(100, Math.max(0, evolutionProgress * 100))
    : 0;

  const handleUpdate = useCallback((clientX: number) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const progress = x / rect.width;
    setEvolutionProgress(progress);
  }, [setEvolutionProgress]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleUpdate(e.clientX);
  }, [handleUpdate]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleUpdate(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleUpdate]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[#BDC3C7]">演化进度</span>
        <span className="text-sm text-[#BDC3C7]">{percentage.toFixed(0)}%</span>
      </div>
      <div
        ref={progressRef}
        className="relative h-2 bg-[#1a2530] rounded-full cursor-pointer overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #F1C40F, #F39C12, #E67E22)',
            boxShadow: '0 0 10px rgba(241, 196, 15, 0.5)'
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
          style={{
            left: `calc(${percentage}% - 8px)`,
            boxShadow: '0 0 8px rgba(241, 196, 15, 0.8)'
          }}
        />
      </div>
    </div>
  );
};
