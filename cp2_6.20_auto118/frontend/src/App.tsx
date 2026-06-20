import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RecipeList from './pages/RecipeList';
import RecipeEditor from './pages/RecipeEditor';
import MealCalendar from './pages/MealCalendar';
import Profile from './pages/Profile';
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
        const message = JSON.parse(event.data);
        if (message.type === 'daily_summary' && message.data) {
          const data: DailySummary = message.data;
          setDailySummary(data);
        } else if (message.date) {
          const data: DailySummary = message;
          setDailySummary(data);
        }
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
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/new" element={<RecipeEditor />} />
            <Route path="/recipes/:id/edit" element={<RecipeEditor />} />
            <Route path="/calendar" element={<MealCalendar />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
