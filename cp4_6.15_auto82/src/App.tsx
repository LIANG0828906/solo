import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Materials from '@/pages/Materials';
import Projects from '@/pages/Projects';
import Gallery from '@/pages/Gallery';
import { useAppStore } from '@/store';
import type { NavTab } from '@/types';

function RouteSync() {
  const location = useLocation();
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  useEffect(() => {
    const path = location.pathname;
    let tab: NavTab = 'home';
    if (path === '/') tab = 'home';
    else if (path.startsWith('/materials')) tab = 'materials';
    else if (path.startsWith('/projects')) tab = 'projects';
    else if (path.startsWith('/gallery')) tab = 'gallery';
    setActiveTab(tab);
  }, [location.pathname, setActiveTab]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  const pageWrapperStyle: React.CSSProperties = {
    opacity: transitionStage === 'fadeIn' ? 1 : 0,
    transform: transitionStage === 'fadeIn' ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out)',
  };

  return (
    <div style={pageWrapperStyle}>
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <RouteSync />
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}
