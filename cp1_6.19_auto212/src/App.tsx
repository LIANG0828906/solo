import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import LostForm from '@/pages/LostForm';
import FoundForm from '@/pages/FoundForm';
import MatchResult from '@/pages/MatchResult';
import MessagePage from '@/pages/MessagePage';
import MessageDetail from '@/pages/MessageDetail';
import MyRecords from '@/pages/MyRecords';
import { useStore } from '@/store';

export default function App() {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/matches" replace />} />
            <Route path="/lost" element={<LostForm />} />
            <Route path="/found" element={<FoundForm />} />
            <Route path="/matches" element={<MatchResult />} />
            <Route path="/messages" element={<MessagePage />} />
            <Route path="/messages/:id" element={<MessageDetail />} />
            <Route path="/records" element={<MyRecords />} />
          </Routes>
        </div>
        <Toast notifications={toasts} onRemove={removeToast} />
      </div>
    </Router>
  );
}
