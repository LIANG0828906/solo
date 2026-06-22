import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import Students from '@/pages/Students';
import Assignments from '@/pages/Assignments';
import { useStore } from '@/store/useStore';

export default function App() {
  const { initStore, isInitialized } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initStore();
      setLoading(false);
    };
    init();
  }, [initStore]);

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/students" element={<Students />} />
          <Route path="/assignments" element={<Assignments />} />
        </Route>
      </Routes>
    </Router>
  );
}
