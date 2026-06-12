import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import OrderConfirm from './OrderConfirm';
import AdminLayout from '../admin/AdminLayout';
import OrderDashboard from '../admin/OrderDashboard';
import InventoryManager from '../admin/InventoryManager';
import ToolManager from '../admin/ToolManager';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="order-confirm" element={<OrderConfirm />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<OrderDashboard />} />
          <Route path="orders" element={<OrderDashboard />} />
          <Route path="inventory" element={<InventoryManager />} />
          <Route path="tools" element={<ToolManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
