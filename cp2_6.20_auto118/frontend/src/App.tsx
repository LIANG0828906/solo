import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RecipeEditor from './pages/RecipeEditor';
import { useStore } from './store/useStore';
import { DailySummary } from './types';

const App = () => {
  const setDailySummary = useStore((state) => state.setDailySummary);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/daily-summary`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data: DailySummary = JSON.parse(event.data);
        setDailySummary(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [setDailySummary]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<div>食谱列表页</div>} />
            <Route path="/recipes/new" element={<RecipeEditor />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditor />} />
            <Route path="/calendar" element={<div>饮食日历页</div>} />
            <Route path="/profile" element={<div>个人中心页</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
