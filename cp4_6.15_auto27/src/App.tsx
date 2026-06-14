import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import TeaArchive from '@/TeaArchive';
import TeaDetail from '@/TeaDetail';
import BrewLog from '@/BrewLog';
import Collection from '@/Collection';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <main className="pt-16 pb-12">
          <Routes>
            <Route path="/" element={<Navigate to="/teas" replace />} />
            <Route path="/teas" element={<TeaArchive />} />
            <Route path="/teas/:id" element={<TeaDetail />} />
            <Route path="/brews" element={<BrewLog />} />
            <Route path="/collections" element={<Collection />} />
            <Route path="/collections/:id" element={<Collection />} />
            <Route path="*" element={<Navigate to="/teas" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
