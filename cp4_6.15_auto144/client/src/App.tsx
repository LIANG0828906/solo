import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const MapView = lazy(() => import('./components/map/MapView'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));

function App() {
  return (
    <Suspense fallback={<div className="loading">加载中...</div>}>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
