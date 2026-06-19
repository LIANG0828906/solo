import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExchangePage from './pages/ExchangePage';
import NotePage from './pages/NotePage';
import NoteDetailPage from './pages/NoteDetailPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<ExchangePage />} />
        <Route path="/notes" element={<NotePage />} />
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </div>
  );
}

export default App;
