import { useEffect } from 'react';
import { useFlowerStore } from '@/store/useFlowerStore';
import { fetchFlowers } from '@/api/api';
import BouquetBuilder from '@/components/BouquetBuilder';

export default function Builder() {
  const { flowers, setFlowers, setLoading, setError } = useFlowerStore();

  useEffect(() => {
    if (flowers.length === 0) {
      setLoading(true);
      fetchFlowers()
        .then(setFlowers)
        .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
        .finally(() => setLoading(false));
    }
  }, [flowers.length, setFlowers, setLoading, setError]);

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="font-display text-3xl text-gray-800">花束构建器</h2>
        <p className="text-gray-400 mt-1">选择你喜爱的花材，打造专属花束</p>
      </div>
      <BouquetBuilder flowers={flowers} />
    </div>
  );
}
