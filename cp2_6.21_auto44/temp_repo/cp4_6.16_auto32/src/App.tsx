import { Routes, Route, Navigate } from 'react-router-dom';
import TripManager from './TripManager';
import TripDetail from './TripDetail';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e2e' }}>
      <Routes>
        <Route path="/" element={<TripManager />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
