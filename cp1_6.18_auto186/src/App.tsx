import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';
import BookingForm from './components/BookingForm';
import AdminUpload from './components/AdminUpload';
import Dashboard from './components/Dashboard';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <span>© {new Date().getFullYear()} 光匣摄影工作室 · 用镜头记录美好</span>
          </div>
          <style>{`
            .footer {
              padding: 24px 0;
              text-align: center;
              color: #888;
              font-size: 13px;
              border-top: 1px solid var(--color-border);
              margin-top: 48px;
              background: rgba(255, 255, 255, 0.5);
            }
          `}</style>
        </footer>
      </div>
    </BrowserRouter>
  );
}
