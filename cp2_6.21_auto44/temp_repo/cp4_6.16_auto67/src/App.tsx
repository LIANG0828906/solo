import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoadingMask } from './components/LoadingMask';
import { useAppStore } from './store/useAppStore';

function App() {
  const { isLoading, initApp, initialized } = useAppStore();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    if (!isLoading && initialized) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, initialized]);

  return (
    <>
      <LoadingMask visible={showLoading} />

      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/song/:id" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
