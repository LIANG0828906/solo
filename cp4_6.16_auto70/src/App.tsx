import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePlantStore } from '@/store/plantStore';
import Layout from '@/components/layout/Layout';
import PlantList from '@/components/PlantList';
import PlantDetail from '@/components/PlantDetail';
import CalendarView from '@/components/CalendarView';
import AddPlantModal from '@/components/AddPlantModal';
import type { Plant } from '@/types';

function App() {
  const init = usePlantStore((state) => state.init);
  const addPlant = usePlantStore((state) => state.addPlant);
  const initialized = usePlantStore((state) => state.initialized);
  const [showAddPlant, setShowAddPlant] = useState(false);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  const handleAddPlant = async (data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addPlant(data);
  };

  return (
    <>
      <Routes>
        <Route element={<Layout onAddPlant={() => setShowAddPlant(true)} />}>
          <Route path="/" element={<PlantList />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <AddPlantModal
        open={showAddPlant}
        onClose={() => setShowAddPlant(false)}
        onSubmit={handleAddPlant}
      />
    </>
  );
}

export default App;
