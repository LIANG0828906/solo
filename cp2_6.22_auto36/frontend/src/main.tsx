import React from 'react';
import ReactDOM from 'react-dom/client';
import { CardBoard } from './components/CardBoard';
import { useWebSocket } from './hooks/useWebSocket';
import './styles.css';

const App: React.FC = () => {
  const ws = useWebSocket();
  return <CardBoard ws={ws} />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
