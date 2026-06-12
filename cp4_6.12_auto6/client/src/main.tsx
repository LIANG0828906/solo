import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerPage from './customer/CustomerPage';
import BookDetail from './customer/BookDetail';
import AdminDashboard from './admin/AdminDashboard';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/books" element={<AdminDashboard />} />
        <Route path="/admin/pricing" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
