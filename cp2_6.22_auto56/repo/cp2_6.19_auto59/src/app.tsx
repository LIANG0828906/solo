import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { StatisticsBar } from '@/components/layout/statisticsBar';
import { useStore } from '@/stores/useStore';

const ProductList = React.lazy(() => import('@/modules/products/productList').then(m => ({ default: m.ProductList })));
const OrderList = React.lazy(() => import('@/modules/orders/orderList').then(m => ({ default: m.OrderList })));
const DeliveryMap = React.lazy(() => import('@/modules/delivery/deliveryMap').then(m => ({ default: m.DeliveryMap })));

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setDisplayLocation(location);
      setTransitionStage('fadeIn');
    }
  };

  return (
    <div
      className={`route-container ${transitionStage}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <React.Suspense
        fallback={
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">加载中...</p>
          </div>
        }
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/delivery" element={<DeliveryMap />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </React.Suspense>
      <style>{`
        .route-container {
          min-height: calc(100vh - 64px - 112px);
        }
        .route-container.fadeIn {
          animation: fadeIn 300ms ease-out;
        }
        .route-container.fadeOut {
          animation: fadeOut 300ms ease-in;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 16px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-text {
          color: var(--color-text-light);
          font-size: 14px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const App: React.FC = () => {
  const initializeMockData = useStore((state) => state.initializeMockData);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeMockData();
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, [initializeMockData]);

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <style>{`
          .app-loading {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--color-background);
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--color-border);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Header />
        <StatisticsBar />
        <main className="main-content">
          <AnimatedRoutes />
        </main>
      </div>
      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .main-content {
          flex: 1;
        }
      `}</style>
    </Router>
  );
};
