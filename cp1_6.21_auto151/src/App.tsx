import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { TravelProvider, useTravel } from '@/context/TravelContext';
import Planner from '@/modules/Planner/Planner';
import NoteGen from '@/modules/NoteGen/NoteGen';
import './App.css';

function MainLayout() {
  const { state, dispatch } = useTravel();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false });
      } else {
        dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: true });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [dispatch]);

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: !state.sidebarVisible });
  };

  return (
    <div className="app-container">
      {isMobile && (
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      )}
      
      <Planner />
      <NoteGen />
    </div>
  );
}

function App() {
  return (
    <TravelProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TravelProvider>
  );
}

export default App;
