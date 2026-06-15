import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Members from '@/pages/Members';
import Activities from '@/pages/Activities';
import Board from '@/pages/Board';

export default function App() {
  return (
    <Router>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/members" replace />} />
            <Route path="/members" element={<Members />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/board" element={<Board />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
