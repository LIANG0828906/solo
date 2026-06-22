import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import NotificationToast from './components/NotificationToast';
import HomePage from './pages/HomePage';
import OrderDetailPage from './pages/OrderDetailPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <div className="app">
      <NavBar />
      <NotificationToast />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/order/:id" element={<OrderDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}

export default App;
