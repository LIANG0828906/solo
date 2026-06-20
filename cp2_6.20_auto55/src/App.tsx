import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import VoteDetailPage from '@/pages/VoteDetailPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vote/:id" element={<VoteDetailPage />} />
      </Routes>
    </Router>
  );
}
