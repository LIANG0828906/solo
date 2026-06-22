import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WatchProvider } from './context/WatchContext';
import Home from '@/pages/Home';
import DetailPage from '@/pages/DetailPage';

export default function App() {
  return (
    <WatchProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <div className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/detail/:id" element={<DetailPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </WatchProvider>
  );
}
