import { Routes, Route, Navigate } from 'react-router-dom';
import OverviewPanel from './modules/overview/OverviewPanel';
import PlantList from './modules/plants/PlantList';
import TimelinePage from './modules/timeline/TimelinePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPanel />} />
      <Route path="/plants" element={<PlantList />} />
      <Route path="/plant/:id" element={<TimelinePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
