import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlantList from '@/plants/PlantList';
import PlantDetail from '@/plants/PlantDetail';
import SymptomRecorder from '@/diagnostics/SymptomRecorder';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlantList />} />
        <Route path="/plant/:plantId" element={<PlantDetail />} />
        <Route path="/plant/:plantId/record" element={<SymptomRecorder />} />
      </Routes>
    </Router>
  );
}
