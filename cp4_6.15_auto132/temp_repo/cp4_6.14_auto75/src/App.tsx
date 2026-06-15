import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import RankingBoard from '@/ranking/RankingBoard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/ranking"
        element={
          <div className="app-container">
            <div className="ranking-section" style={{ width: '100%' }}>
              <RankingBoard />
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
