import React, { useState } from 'react';
import Card from './components/Card';
import Gallery from './components/Gallery';
import { Link, useLocation } from 'react-router-dom';

export default function App() {
  const [view, setView] = useState<'card' | 'gallery'>('card');
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname === '/gallery') {
      setView('gallery');
    } else {
      setView('card');
    }
  }, [location.pathname]);

  const handleSaveSuccess = () => {
    setView('gallery');
    window.history.pushState(null, '', '/gallery');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Link
          to="/"
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === 'card'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setView('card')}
        >
          灵感卡片
        </Link>
        <Link
          to="/gallery"
          className={`px-4 py-2 rounded-lg transition-colors ${
            view === 'gallery'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setView('gallery')}
        >
          我的画廊
        </Link>
      </div>

      {view === 'card' ? (
        <Card onSaveSuccess={handleSaveSuccess} />
      ) : (
        <Gallery />
      )}

      <style>{`
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @keyframes gradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .min-h-screen {
          min-height: 100vh;
          background: linear-gradient(-45deg, #f5f7fa, #c3cfe2, #f5f7fa, #c3cfe2);
          background-size: 400% 400%;
          animation: gradientAnimation 16s ease infinite;
        }
      `}</style>
    </div>
  );
}
