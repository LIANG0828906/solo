import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import RecipePage from './pages/RecipePage';
import './index.css';

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, width: '100%' }}>
          <div className="app-container" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipe/:id" element={<RecipePage />} />
            </Routes>
          </div>
        </main>
        <Footer />
        <Toast />
      </div>
    </Router>
  );
}
