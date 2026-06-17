import { useState, createContext, useContext, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CourseCatalog from './components/CourseCatalog';
import CourseDetail from './components/CourseDetail';
import UserProfile from './components/UserProfile';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastMessage['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();

  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const getToastStyle = (type: ToastMessage['type']): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '12px 24px',
      borderRadius: 8,
      marginBottom: 8,
      fontSize: 14,
      color: 'white',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      animation: 'toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    };
    if (type === 'success') base.background = '#5B9279';
    else if (type === 'error') base.background = '#E74C3C';
    else base.background = '#636E72';
    return base;
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Navbar />
      <div key={location.pathname} className="page-fade-in">
        <div className="container">
          <Routes>
            <Route path="/" element={<CourseCatalog />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
      </div>

      <style>{`
        @keyframes toastSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={getToastStyle(toast.type)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default App;
