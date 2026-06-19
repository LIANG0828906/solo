import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import AssetPage from '@/pages/AssetPage';
import AnalysisPage from '@/pages/AnalysisPage';
import ReportPage from '@/pages/ReportPage';
import { useAssetStore } from '@/modules/asset/assetStore';

const App: React.FC = () => {
  const loadFromStorage = useAssetStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-bg-primary overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/asset" replace />} />
              <Route path="/asset" element={<AssetPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="*" element={<Navigate to="/asset" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
