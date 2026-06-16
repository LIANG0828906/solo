import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { BookShelf } from './books/BookShelf';
import { SwapManagement } from './swap/SwapManagement';
import { SwapHistoryPage } from './swap/SwapHistory';
import { CommunityFeed } from './community/CommunityFeed';
import { useToast } from './hooks/useToast';

export default function App() {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<BookShelf showToast={showToast} />} />
            <Route path="/user/:userId" element={<BookShelf showToast={showToast} />} />
            <Route path="/swap" element={<SwapManagement showToast={showToast} />} />
            <Route path="/history" element={<SwapHistoryPage showToast={showToast} />} />
            <Route path="/community" element={<CommunityFeed showToast={showToast} />} />
          </Routes>
        </main>
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </Router>
  );
}
