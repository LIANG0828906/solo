import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/animations.css';
import { useDocStore } from '@/store/docStore';

const initStore = () => {
  const store = useDocStore.getState();
  store.addHistoryRecord();
};

initStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
