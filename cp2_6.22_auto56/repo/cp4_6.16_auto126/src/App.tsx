import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import RecipeModule from '@/modules/RecipeModule';
import UserModule from '@/modules/UserModule';
import { useAppStore } from '@/store/useAppStore';
import './App.css';

const App: React.FC = () => {
  const { initializeData, viewMode } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeData();
      setIsInitialized(true);
    };
    init();
  }, [initializeData]);

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-icon">🍳</div>
        <p>FlavorFuse 正在加载美味...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'favorites':
        return <UserModule mode="favorites" />;
      case 'my-recipes':
        return <UserModule mode="my-recipes" />;
      default:
        return <RecipeModule />;
    }
  };

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <div key={viewMode} className="content-wrapper fade-in">
            {renderContent()}
          </div>
        </main>
        <Toast />
      </div>
    </Router>
  );
};

export default App;
