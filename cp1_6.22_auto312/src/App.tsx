import React, { useCallback, useMemo, useState } from 'react';
import type { Plant, PlantCategory } from './types';
import { deletePlant, getPlants, loadPlants } from './plantManager';
import PlantCard from './components/PlantCard';
import SearchBar from './components/SearchBar';
import Menu from './components/Menu';
import AddPlantModal from './components/AddPlantModal';
import ConfirmDialog from './components/ConfirmDialog';
import Chart from './components/Chart';
import LogPanel from './components/LogPanel';
import styles from './App.module.css';

const categoryColors: Record<string, string> = {
  多肉: styles.categorySucculent,
  观叶: styles.categoryFoliage,
  开花: styles.categoryFlowering,
  水生: styles.categoryAquatic,
};

const App: React.FC = function App() {
  const [plants, setPlants] = useState<Plant[]>(() => getPlants());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<PlantCategory>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Plant | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPlants = useCallback(() => {
    setPlants(getPlants());
    setRefreshKey((prev) => prev + 1);
  }, []);

  const filteredPlants = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return plants.filter((plant) => {
      const matchesSearch =
        !query ||
        plant.name.toLowerCase().includes(query) ||
        plant.category.toLowerCase().includes(query);

      const matchesFilter =
        activeFilters.size === 0 || activeFilters.has(plant.category);

      return matchesSearch && matchesFilter;
    });
  }, [plants, searchQuery, activeFilters]);

  const visibleIds = useMemo(
    () => new Set(filteredPlants.map((p) => p.id)),
    [filteredPlants]
  );

  const handleFilterToggle = useCallback((category: PlantCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handlePlantClick = useCallback((plant: Plant) => {
    setSelectedPlant(plant);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPlant(null);
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    const plant = plants.find((p) => p.id === id);
    if (plant) {
      setDeleteConfirm(plant);
    }
  }, [plants]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) {
      deletePlant(deleteConfirm.id);
      setDeleteConfirm(null);
      refreshPlants();
      if (selectedPlant?.id === deleteConfirm.id) {
        setSelectedPlant(null);
      }
    }
  }, [deleteConfirm, selectedPlant, refreshPlants]);

  const handleRecordAdded = useCallback(() => {
    loadPlants();
    const updated = getPlants();
    setPlants(updated);
    if (selectedPlant) {
      const updatedPlant = updated.find((p) => p.id === selectedPlant.id);
      if (updatedPlant) {
        setSelectedPlant(updatedPlant);
      }
    }
  }, [selectedPlant]);

  if (selectedPlant) {
    return (
      <div className={styles.app}>
        <div className={styles.detailView}>
          <div className={styles.detailHeader}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
              aria-label="返回"
            >
              <svg
                className={styles.backIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className={styles.detailTitle}>
              {selectedPlant.name}
              <span
                className={`${styles.detailCategory} ${
                  categoryColors[selectedPlant.category]
                }`}
              >
                {selectedPlant.category}
              </span>
            </h1>
          </div>
          <Chart plant={selectedPlant} key={refreshKey} />
          <LogPanel plant={selectedPlant} onRecordAdded={handleRecordAdded} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🌱</span>
          植物图鉴
        </h1>
        <div className={styles.headerActions}>
          <Menu onDataImported={refreshPlants} />
        </div>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
      />

      {plants.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🪴</div>
          <h2 className={styles.emptyTitle}>还没有植物</h2>
          <p className={styles.emptyText}>
            点击右下角的 <span className={styles.highlight}>+</span> 按钮添加你的第一株植物，
            开始记录它们的生长历程吧！
          </p>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h2 className={styles.emptyTitle}>没有找到匹配的植物</h2>
          <p className={styles.emptyText}>
            试试调整搜索关键词或筛选条件，或者添加新的植物。
          </p>
        </div>
      ) : (
        <div className={styles.plantGrid}>
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onClick={handlePlantClick}
              onDelete={handleDeleteRequest}
              isVisible={visibleIds.has(plant.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setShowAddModal(true)}
        aria-label="添加植物"
      >
        +
      </button>

      {showAddModal && (
        <AddPlantModal
          onClose={() => setShowAddModal(false)}
          onAdded={refreshPlants}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="确认删除"
          message="确定要删除植物 "
          plantName={deleteConfirm.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default App;
