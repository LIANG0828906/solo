import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { seedMockData } from '@/modules/backend/data/cafeData';
import './index.css';

function AppInitializer() {
  useEffect(() => {
    const initData = async () => {
      try {
        await seedMockData();
      } catch (error) {
        console.error('初始化数据失败:', error);
      }
    };
    initData();
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>
);
