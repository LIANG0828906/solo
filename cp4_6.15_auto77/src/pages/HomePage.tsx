import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Navbar from '../components/Navbar';
import PlantCard from '../components/PlantCard';
import { useStore } from '../store';
import type { DifficultyFilter, Plant } from '../types';

const filterOptions: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'easy', label: '容易' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
];

function getDifficultyRange(filter: DifficultyFilter): [number, number] {
  switch (filter) {
    case 'easy':
      return [1, 2];
    case 'medium':
      return [3, 3];
    case 'hard':
      return [4, 5];
    default:
      return [1, 5];
  }
}

export default function HomePage() {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<DifficultyFilter>('all');
  const [searchKey, setSearchKey] = useState(0);
  const { plants, newPlantIds } = useStore(
    useShallow((s) => ({ plants: s.plants as Plant[], newPlantIds: s.newPlantIds }))
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setSearchKey((k) => k + 1);
  };

  const filteredPlants = useMemo(() => {
    const [minD, maxD] = getDifficultyRange(activeFilter);
    return plants.filter((p) => {
      const matchDifficulty = p.difficulty >= minD && p.difficulty <= maxD;
      const matchSearch =
        searchValue.trim() === '' ||
        p.name.toLowerCase().includes(searchValue.trim().toLowerCase());
      return matchDifficulty && matchSearch;
    });
  }, [plants, activeFilter, searchValue]);

  const isSearching = searchValue.trim() !== '';

  return (
    <div className="route-enter min-h-screen bg-beige-100 pb-24 md:pb-8">
      <Navbar searchValue={searchValue} onSearchChange={handleSearchChange} />

      <main className="max-w-6xl mx-auto px-4 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-olive-800 font-merriweather mb-2">
            发现植物 🌿
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            浏览社区分享的绿植，把喜欢的植物带回家
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={`filter-pill px-5 py-2 rounded-full text-sm font-medium border border-olive-200 bg-white text-gray-600 hover:bg-olive-50 ${
                activeFilter === opt.key ? 'active' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filteredPlants.length === 0 ? (
          <div className="text-center py-20">
            <i className="fas fa-leaf text-6xl text-olive-200 mb-4 block"></i>
            <p className="text-gray-400 text-lg">没有找到相关植物</p>
            <p className="text-gray-300 text-sm mt-2">试试其他关键词或筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={`${plant.id}-${isSearching ? searchKey : 'static'}`}
                plant={plant}
                isNew={newPlantIds.includes(plant.id)}
                isSearchResult={isSearching}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
