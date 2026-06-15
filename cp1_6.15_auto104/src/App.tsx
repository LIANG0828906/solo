import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import Navbar from '@/components/Navbar';
import Onboarding from '@/components/Onboarding';
import MorningRoutine from '@/components/MorningRoutine';
import EveningRoutine from '@/components/EveningRoutine';
import Dashboard from '@/components/Dashboard';
import History from '@/components/History';

function AppContent() {
  const { isOnboarded, setUserId, setOnboarded } = useStore();
  const location = useLocation();

  useEffect(() => {
    const storedId = localStorage.getItem('ritual_user_id');
    if (storedId) {
      setUserId(storedId);
      setOnboarded(true);
    }
  }, [setUserId, setOnboarded]);

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        <div className="page-enter" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/morning" replace />} />
            <Route path="/morning" element={<MorningRoutine />} />
            <Route path="/evening" element={<EveningRoutine />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
