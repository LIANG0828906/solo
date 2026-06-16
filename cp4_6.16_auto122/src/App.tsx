import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { PlansPage } from './pages/PlansPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { SocialPage } from './pages/SocialPage';
import { Navigation } from './components/Navigation';
import './styles/globals.css';
import './styles/App.css';

type PageType = 'plans' | 'workout' | 'social';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plans, currentPlanId, setCurrentPlan, loadData, isLoading } = useAppStore();
  const [currentPage, setCurrentPage] = useState<PageType>('plans');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (location.pathname.startsWith('/workout')) {
      setCurrentPage('workout');
    } else if (location.pathname.startsWith('/social')) {
      setCurrentPage('social');
    } else {
      setCurrentPage('plans');
    }
  }, [location.pathname]);

  const handleNavigate = (page: PageType) => {
    if (page === 'plans') {
      navigate('/');
    } else if (page === 'workout') {
      if (currentPlanId) {
        navigate(`/workout/${currentPlanId}`);
      }
    } else if (page === 'social') {
      navigate('/social');
    }
    setCurrentPage(page);
  };

  const handleSelectPlan = (planId: string) => {
    setCurrentPlan(planId);
  };

  const handleStartWorkout = () => {
    if (currentPlanId) {
      navigate(`/workout/${currentPlanId}`);
      setCurrentPage('workout');
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navigation
        plans={plans}
        currentPlanId={currentPlanId}
        onSelectPlan={handleSelectPlan}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onStartWorkout={handleStartWorkout}
      />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<PlansPage />} />
          <Route path="/workout/:planId" element={<WorkoutPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
