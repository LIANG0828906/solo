import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from '@/pages/Home';
import Detail from '@/pages/Detail';
import { useStore } from '@/store';

function DetailModal() {
  const { id } = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  if (!id) return <Navigate to="/" replace />;

  return (
    <>
      <Home />
      <Detail itemId={id} mounted={mounted} onClose={() => window.history.back()} />
    </>
  );
}

export default function App() {
  const checkExpiredRequests = useStore((s) => s.checkExpiredRequests);

  useEffect(() => {
    checkExpiredRequests();
    const interval = setInterval(checkExpiredRequests, 60000);
    return () => clearInterval(interval);
  }, [checkExpiredRequests]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item/:id" element={<DetailModal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
