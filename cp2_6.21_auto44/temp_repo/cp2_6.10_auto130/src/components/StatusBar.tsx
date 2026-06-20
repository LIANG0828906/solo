import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { calculateAvgSaturation, calculateContrastScore } from '../utils/colorUtils';

export const StatusBar: React.FC = () => {
  const { placedMaterials } = useAppStore();

  const stats = useMemo(() => {
    const colors = placedMaterials.map((m) => m.currentColor);
    return {
      count: placedMaterials.length,
      avgSaturation: calculateAvgSaturation(colors),
      contrastScore: calculateContrastScore(colors),
    };
  }, [placedMaterials]);

  return (
    <div
      className="flex items-center justify-center gap-8 py-2 px-4 rounded"
      style={{
        background: 'rgba(62, 39, 35, 0.9)',
        color: '#f5e6c8',
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '14px',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="opacity-70">素材总数：</span>
        <span className="font-bold">{stats.count}</span>
      </div>
      <div className="w-px h-4 bg-current opacity-30" />
      <div className="flex items-center gap-2">
        <span className="opacity-70">平均饱和度：</span>
        <span className="font-bold">{stats.avgSaturation}%</span>
      </div>
      <div className="w-px h-4 bg-current opacity-30" />
      <div className="flex items-center gap-2">
        <span className="opacity-70">对比度得分：</span>
        <span className="font-bold">{stats.contrastScore}</span>
      </div>
    </div>
  );
};
