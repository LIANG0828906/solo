import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { usePlantStore } from './store';
import { HomePage } from './HomePage';
import { PlantDetail } from './PlantDetail';
import { PlantForm } from './PlantForm';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<HomePage />} />
      <Route path="/add" element={<PlantForm />} />
      <Route path="/plant/:id" element={<PlantDetail />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  const loadData = usePlantStore(s => s.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <BrowserRouter>
      <div className="app-root">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};
