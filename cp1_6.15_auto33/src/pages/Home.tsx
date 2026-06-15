import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { useFlowerStore } from '@/store/useFlowerStore';
import { fetchFlowers } from '@/api/api';
import FlowerGrid from '@/components/FlowerGrid';
import type { Flower } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const { flowers, setFlowers, isLoading, setLoading, setError } = useFlowerStore();

  useEffect(() => {
    setLoading(true);
    fetchFlowers()
      .then(setFlowers)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [setFlowers, setLoading, setError]);

  const handleSelectFlower = (flower: Flower) => {
    if (flower.stock <= 0) return;
    navigate('/builder');
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="font-display text-4xl md:text-5xl text-gray-800 mb-3">
          花间小筑
        </h1>
        <p className="text-gray-400 font-display text-lg">每一朵花，都是一份心意</p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate('/builder')}
          className="flex items-center gap-2 px-8 py-3.5 bg-rose-500 text-white rounded-full
                     font-display text-lg shadow-lg shadow-rose-200
                     hover:bg-rose-600 hover:-translate-y-0.5 hover:shadow-xl
                     hover:shadow-rose-200 transition-all duration-300 active:scale-95"
        >
          <Flower2 size={22} />
          创建花束
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <FlowerGrid flowers={flowers} onSelectFlower={handleSelectFlower} />
      )}
    </div>
  );
}
