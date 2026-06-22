import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapView from '@/components/MapView';
import DetailPage from '@/components/DetailPage';
import ExplorationForm from '@/components/ExplorationForm';
import ProfilePage from '@/components/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="w-full h-full min-h-screen bg-city-bg">
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/exploration/:id" element={<DetailPage />} />
          <Route path="/exploration/:id/edit" element={<ExplorationForm />} />
          <Route path="/publish" element={<ExplorationForm />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
