import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import ExplorePage from '@/pages/ExplorePage';
import CreatePage from '@/pages/CreatePage';
import DetailPage from '@/pages/DetailPage';
import { usePaletteStore } from '@/stores/usePaletteStore';
import { initSampleData } from '@/utils/sampleData';

const App: React.FC = () => {
  const loadFavorites = usePaletteStore((state) => state.loadFavorites);

  useEffect(() => {
    const init = async () => {
      await initSampleData();
      await loadFavorites();
    };
    init();
  }, [loadFavorites]);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <PageTransition>
                  <ExplorePage />
                </PageTransition>
              }
            />
            <Route
              path="/create"
              element={
                <PageTransition>
                  <CreatePage />
                </PageTransition>
              }
            />
            <Route
              path="/palette/:colorId"
              element={
                <PageTransition>
                  <DetailPage />
                </PageTransition>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
