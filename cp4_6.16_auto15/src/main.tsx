import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useTaskStore } from './modules/task/TaskStore';
import { setTaskStoreRef } from './modules/meeting/MeetingStore';

function StoreInitializer() {
  useEffect(() => {
    const store = useTaskStore.getState();
    setTaskStoreRef(store);
  }, []);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreInitializer />
    <App />
  </StrictMode>,
);
