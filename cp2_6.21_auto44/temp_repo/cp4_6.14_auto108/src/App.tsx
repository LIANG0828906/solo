import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CardListPage from './pages/CardListPage';
import ReviewPage from './pages/ReviewPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<CardListPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </div>
  );
}

export default App;
