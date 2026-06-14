import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { StallPage } from '@/pages/StallPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { useMarketStore } from '@/store/useMarketStore';

function App() {
  const init = useMarketStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stall" element={<StallPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
