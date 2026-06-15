import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from 'react';
import { MapPage } from "@/pages/MapPage";
import { DetailPage } from "@/pages/DetailPage";
import { EditorPage } from "@/pages/EditorPage";

function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    wrapper.style.transition = 'none';
    wrapper.style.transform = 'translateX(100%)';
    wrapper.style.opacity = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrapper.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease-out';
        wrapper.style.transform = 'translateX(0)';
        wrapper.style.opacity = '1';
      });
    });
  }, [location.pathname]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/location/:locationId" element={<DetailPage />} />
      <Route path="/diary/new" element={<EditorPage />} />
      <Route path="/diary/:diaryId" element={<EditorPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <RouteTransition>
        <AppRoutes />
      </RouteTransition>
    </Router>
  );
}
