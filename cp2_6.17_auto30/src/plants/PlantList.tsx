import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PlantCard } from './PlantCard';
import { PlantForm } from './PlantForm';
import { SearchInput } from '../components/SearchInput';
import type { Plant } from '../types';
import './PlantList.css';

export function PlantList() {
  const plants = useStore(state => state.plants);
  const isLoading = useStore(state => state.isLoading);
  const addPlant = useStore(state => state.addPlant);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filteredPlants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = plants.filter(p => {
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.species.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    });
    return result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return 0;
    });
  }, [plants, searchQuery]);

  const handleAddPlant = (data: Omit<Plant, 'id' | 'isFavorite'>) => {
    addPlant(data);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="loading-state">加载中...</div>;
  }

  return (
    <div className="plant-list-page">
      <div className="list-header">
        <div className="header-left">
          <h1 className="page-title">🌿 我的植物</h1>
          <span className="plant-count">共 {plants.length} 株多肉</span>
        </div>
        <div className="header-right">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索名称、品种、位置..."
          />
          <button
            className="add-plant-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ 取消' : '＋ 添加植物'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <PlantForm
            onSubmit={handleAddPlant}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {filteredPlants.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">🌵</span>
          <p>没有找到匹配的多肉</p>
        </div>
      ) : (
        <div className="plants-grid">
          {filteredPlants.map(plant => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
