import { usePlantStore } from '@/store/plantStore';
import { PlantCard } from './PlantCard';
import { Flower, Loader2 } from 'lucide-react';

export default function PlantList() {
  const { plants, getLastCareDate, loading, initialized } = usePlantStore();

  if (!initialized || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-app-text-light text-sm">正在加载植物档案...</p>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Flower className="w-12 h-12 text-primary/60" />
        </div>
        <h2 className="text-xl font-serif font-semibold mb-2">还没有植物档案</h2>
        <p className="text-app-text-light text-sm max-w-xs">
          点击右上角「添加植物」按钮，开始记录你的第一株植物养护日记吧 🌱
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-app-text">我的植物</h2>
          <p className="text-sm text-app-text-light mt-1">
            共 {plants.length} 株植物 · 按最近养护时间排序
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plants.map((plant, index) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            lastCareDate={getLastCareDate(plant.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
