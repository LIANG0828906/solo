import React, { useState, useCallback } from 'react';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 1500);
  }, []);

  return (
    <>
      <HomePage showToast={showToast} />

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: toastVisible
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(-20px)',
            zIndex: 9999,
            backgroundColor: '#43A047',
            color: '#FFFFFF',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            opacity: toastVisible ? 1 : 0,
            transition: 'all .3s ease',
            animation: toastVisible ? 'toastIn .3s ease' : 'none',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default App;
