import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import TimelinePage from './pages/TimelinePage';
import AchievementsPage from './pages/AchievementsPage';
import StatsPage from './pages/StatsPage';

const AppContent = () => {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar currentPath={currentPath} />
      <main
        style={{
          flex: 1,
        }}
      >
        <Routes>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
