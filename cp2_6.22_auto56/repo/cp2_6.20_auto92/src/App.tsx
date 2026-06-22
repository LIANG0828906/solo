import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import HRPage from './pages/HRPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <div className="main-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:employeeId" element={<HistoryPage />} />
        <Route path="/hr" element={<HRPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
