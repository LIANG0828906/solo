import React, { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FilterPanel } from './module2/FilterPanel';
import { FoodMap } from './module1/FoodMap';
import { CreateRecipeForm } from './components/CreateRecipeForm';
import { RecipeModal } from './components/RecipeModal';
import { useRecipeStore } from './store/useRecipeStore';

const App: React.FC = () => {
  const { isSidebarOpen } = useRecipeStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '260px');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      <Navbar />

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <FilterPanel isOpen={isSidebarOpen} />
        <FoodMap />
      </div>

      <CreateRecipeForm />
      <RecipeModal />
    </div>
  );
};

export default App;
