import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import ClientDetail from '@/pages/ClientDetail';
import QuoteEditorPage from '@/pages/QuoteEditorPage';
import { useClientStore } from '@/modules/client/store';
import { useQuoteStore } from '@/modules/quote/store';

export default function App() {
  const loadClientData = useClientStore((state) => state.loadFromDB);
  const loadQuoteData = useQuoteStore((state) => state.loadFromDB);

  useEffect(() => {
    void loadClientData();
    void loadQuoteData();
  }, [loadClientData, loadQuoteData]);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/client/:clientId" element={<ClientDetail />} />
          <Route path="/quote/:projectId" element={<QuoteEditorPage />} />
        </Routes>
      </div>
    </Router>
  );
}
