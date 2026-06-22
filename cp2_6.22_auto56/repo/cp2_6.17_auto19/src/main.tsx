import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerScreen } from './ordering/CustomerScreen';
import { OrderConfirmation } from './ordering/OrderConfirmation';
import { KitchenDisplay } from './dispatch/KitchenDisplay';
import { AdminPanel } from './admin/AdminPanel';
import { Toast } from './components/Toast';
import { initDB } from './utils/indexedDB';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<CustomerScreen />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  initDB().then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }).catch(error => {
    console.error('Failed to initialize database:', error);
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
