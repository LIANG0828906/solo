import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { useSeatStore } from './stores/seatStore';
import './styles.css';

const InitWrapper: React.FC = () => {
  const initialize = useSeatStore((s) => s.initialize);
  const initialized = useSeatStore((s) => s.initialized);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1A1A2C',
          color: '#888888',
          fontSize: 16,
        }}
      >
        正在加载座位数据...
      </div>
    );
  }

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<InitWrapper />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
