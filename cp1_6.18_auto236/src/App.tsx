import React, { useEffect, useState } from 'react';
import InventoryPanel from './components/InventoryPanel';
import RecipePanel from './components/RecipePanel';
import ShoppingList from './components/ShoppingList';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const { isShoppingListOpen } = useAppStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 800;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFF8F0 0%, #FFEEDB 100%)',
        padding: '32px 20px',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isShoppingListOpen && !isMobile ? 'translateX(-20px)' : 'translateX(0)',
      }}
    >
      <style>{`
        @media (max-width: 800px) {
          .inventory-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .recipe-grid > div {
            width: 100% !important;
          }
          .recipe-grid {
            grid-template-columns: 1fr !important;
          }
          .shopping-panel {
            width: 100% !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0,
              marginBottom: '8px',
              letterSpacing: '2px',
            }}
          >
            🧊 配方魔方
          </h1>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            根据冰箱现有食材，智能推荐美味菜谱
          </p>
        </header>

        <InventoryPanel />
        <RecipePanel />
      </div>

      <ShoppingList />
    </div>
  );
};

export default App;
