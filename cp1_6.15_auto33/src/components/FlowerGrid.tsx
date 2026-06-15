import { useState, useMemo } from 'react';
import type { Flower, FlowerCategory } from '@/types';
import FlowerCard from './FlowerCard';

interface FlowerGridProps {
  flowers: Flower[];
  onSelectFlower?: (flower: Flower) => void;
}

const CATEGORIES: { label: string; value: FlowerCategory | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '🌹 玫瑰', value: 'rose' },
  { label: '🪷 百合', value: 'lily' },
  { label: '🌷 郁金香', value: 'tulip' },
  { label: '💐 混合', value: 'mixed' },
];

function buildPriceRanges(flowers: Flower[]) {
  if (flowers.length === 0) {
    return [{ label: '全部价格', min: 0, max: Infinity }];
  }
  const prices = flowers.map((f) => f.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const ranges = [{ label: '全部价格', min: 0, max: Infinity }];

  if (maxP <= 15) {
    ranges.push({ label: `¥${minP}-${maxP}`, min: minP, max: maxP });
  } else if (maxP <= 30) {
    ranges.push({ label: '¥15以下', min: 0, max: 15 });
    ranges.push({ label: '¥15-25', min: 15, max: 25 });
    ranges.push({ label: '¥25以上', min: 25, max: Infinity });
  } else {
    ranges.push({ label: '¥10以下', min: 0, max: 10 });
    ranges.push({ label: '¥10-20', min: 10, max: 20 });
    ranges.push({ label: '¥20-30', min: 20, max: 30 });
    ranges.push({ label: `¥30以上`, min: 30, max: Infinity });
  }

  return ranges;
}

export default function FlowerGrid({ flowers, onSelectFlower }: FlowerGridProps) {
  const [category, setCategory] = useState<FlowerCategory | 'all'>('all');
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [filterKey, setFilterKey] = useState(0);

  const priceRanges = useMemo(() => buildPriceRanges(flowers), [flowers]);

  const filteredFlowers = useMemo(() => {
    const range = priceRanges[priceRangeIdx];
    return flowers.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (f.price < range.min || f.price > range.max) return false;
      return true;
    });
  }, [flowers, category, priceRangeIdx, priceRanges]);

  const handleCategoryChange = (value: FlowerCategory | 'all') => {
    setCategory(value);
    setPriceRangeIdx(0);
    setFilterKey((k) => k + 1);
  };

  const handlePriceChange = (idx: number) => {
    setPriceRangeIdx(idx);
    setFilterKey((k) => k + 1);
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${
                  category === cat.value
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-500 shadow-sm'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range, idx) => (
            <button
              key={idx}
              onClick={() => handlePriceChange(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                ${
                  priceRangeIdx === idx
                    ? 'bg-sage-300 text-gray-800 shadow-md'
                    : 'bg-white text-gray-500 hover:bg-sage-50 shadow-sm'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {filteredFlowers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🌸</p>
          <p className="text-gray-400 font-display text-lg">没有找到符合条件的鲜花</p>
        </div>
      ) : (
        <div key={filterKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlowers.map((flower, index) => (
            <FlowerCard
              key={flower.id}
              flower={flower}
              index={index}
              onSelect={onSelectFlower}
            />
          ))}
        </div>
      )}
    </div>
  );
}
