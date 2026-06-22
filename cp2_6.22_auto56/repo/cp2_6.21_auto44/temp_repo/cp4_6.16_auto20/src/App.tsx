import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { VotingPage } from '@/modules/voting/components/VotingPage';
import { LoginPage } from '@/modules/auth/components/LoginPage';
import { AdminPage } from '@/modules/admin/components/AdminPage';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<VotingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
