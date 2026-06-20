import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapPage from '@/pages/MapPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
      </Routes>
    </Router>
  );
}
