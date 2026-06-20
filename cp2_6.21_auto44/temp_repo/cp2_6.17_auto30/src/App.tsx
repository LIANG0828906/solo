import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PlantList } from './plants/PlantList';
import { PlantDetail } from './plants/PlantDetail';
import { ReminderPanel } from './reminder/ReminderPanel';
import { SpeciesEncyclopedia } from './species/SpeciesEncyclopedia';
import { useStore } from './store';

function App() {
  const initData = useStore(state => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/plants" replace />} />
          <Route path="/plants" element={<PlantList />} />
          <Route path="/plants/:id" element={<PlantDetail />} />
          <Route path="/reminders" element={<ReminderPanel />} />
          <Route path="/species" element={<SpeciesEncyclopedia />} />
          <Route path="*" element={<Navigate to="/plants" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
