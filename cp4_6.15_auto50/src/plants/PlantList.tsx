import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Sprout } from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import type { PlantLocation } from '@/utils/db';
import PlantCard from '@/components/PlantCard';
import AddPlantModal from '@/components/AddPlantModal';

const locationFilters: (PlantLocation | '全部')[] = ['全部', '阳台', '客厅', '厨房', '卧室', '书房', '其他'];

export default function PlantList() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchQuery = usePlantStore((s) => s.searchQuery);
  const locationFilter = usePlantStore((s) => s.locationFilter);
  const listHasMore = usePlantStore((s) => s.listHasMore);
  const loadAllData = usePlantStore((s) => s.loadAllData);
  const setSearchQuery = usePlantStore((s) => s.setSearchQuery);
  const setLocationFilter = usePlantStore((s) => s.setLocationFilter);
  const addPlant = usePlantStore((s) => s.addPlant);
  const setCurrentPlantId = usePlantStore((s) => s.setCurrentPlantId);
  const loadMorePlants = usePlantStore((s) => s.loadMorePlants);
  const getFilteredPlants = usePlantStore((s) => s.getFilteredPlants);

  const filteredPlants = getFilteredPlants();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && listHasMore) {
          loadMorePlants();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [listHasMore, loadMorePlants]);

  const handleAddPlant = (data: { name: string; purchaseDate: string; location: PlantLocation; photos: string[] }) => {
    addPlant(data);
    setModalOpen(false);
  };

  const handleCardClick = (plantId: string) => {
    setCurrentPlantId(plantId);
    navigate(`/plant/${plantId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-400" />
            <input
              type="text"
              placeholder="搜索植物..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur border border-olive-200 font-body focus:ring-2 focus:ring-olive-400 focus:border-olive-400 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6 pb-1 scrollbar-hide">
          {locationFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setLocationFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                locationFilter === filter
                  ? 'bg-olive-500 text-white'
                  : 'bg-olive-50 text-olive-700 hover:bg-olive-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sprout size={64} className="text-olive-300 mb-4" />
            <h3 className="text-bark-400 font-display font-bold text-xl mb-2">还没有植物</h3>
            <p className="text-bark-300 text-sm">点击右下角按钮添加你的第一盆植物</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map((plant, index) => (
              <div
                key={plant.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
              >
                <PlantCard
                  plant={plant}
                  gradientIndex={index}
                  onClick={() => handleCardClick(plant.id)}
                  onRecordSymptom={() => navigate(`/plant/${plant.id}/record`)}
                  onViewHistory={() => navigate(`/plant/${plant.id}`)}
                  onUpdatePhoto={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const store = usePlantStore.getState();
                        store.updatePlant(plant.id, { photos: [...plant.photos, dataUrl] });
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-olive-500 text-white shadow-xl hover:bg-olive-600 transition-colors flex items-center justify-center"
        >
          <Plus size={24} />
        </button>

        <AddPlantModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddPlant}
        />
      </div>
    </div>
  );
}
