import React, { useEffect } from 'react';
import { useGardenStore } from '../../store/useGardenStore';
import { GardenCard } from './GardenCard';

export const GardenDashboard: React.FC = () => {
  const gardenList = useGardenStore((s) => s.gardenList);
  const loading = useGardenStore((s) => s.loading);
  const error = useGardenStore((s) => s.error);
  const fetchGardens = useGardenStore((s) => s.fetchGardens);

  useEffect(() => {
    fetchGardens();
  }, [fetchGardens]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">加载失败</div>
          <div className="text-sm text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 md:p-6"
      style={{ backgroundColor: '#EDE7D6' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🌿 社区菜畦</h2>
          <p className="text-sm text-gray-600 mt-1">
            共 {gardenList.filter((g) => g.claimed).length}/{gardenList.length} 块已认领
          </p>
        </div>
      </div>

      {loading && gardenList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[220px] bg-white/60 rounded-xl animate-pulse"
              style={{ borderRadius: '12px' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gardenList.map((garden) => (
            <GardenCard key={garden.id} garden={garden} />
          ))}
        </div>
      )}
    </div>
  );
};
