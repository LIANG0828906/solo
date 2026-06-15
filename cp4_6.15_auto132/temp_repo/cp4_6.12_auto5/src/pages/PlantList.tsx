import { useState, useEffect } from 'react';
import { Plant } from '../types';
import PlantCard from '../components/PlantCard';
import OrderModal from '../components/OrderModal';

interface Props {
  isAdmin: boolean;
}

export default function PlantList({ isAdmin }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const res = await fetch('/api/plants');
      const data = await res.json();
      setPlants(data);
    } catch (e) {
      console.error('获取植物列表失败', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = plants.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'low') return p.stock < 3;
    if (filter === 'available') return p.stock > 0;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🌿 植物商城</h1>
        <div className="filter-bar">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            可租
          </button>
          {isAdmin && (
            <button
              className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
              onClick={() => setFilter('low')}
            >
              低库存
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="plant-grid">
          {filteredPlants.map(plant => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onOrder={() => setSelectedPlant(plant)}
              showAdminBadge={isAdmin}
            />
          ))}
        </div>
      )}

      {selectedPlant && (
        <OrderModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onSuccess={() => {
            setSelectedPlant(null);
            fetchPlants();
          }}
        />
      )}
    </div>
  );
}
