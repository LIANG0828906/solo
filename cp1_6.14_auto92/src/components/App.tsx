import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';
import Dashboard from '@/pages/Dashboard';
import CustomersPage from '@/pages/CustomersPage';
import ReceiptsPage from '@/pages/ReceiptsPage';
import ReceiptForm from '@/pages/ReceiptForm';
import ReceiptDetail from '@/pages/ReceiptDetail';
import StatementsPage from '@/pages/StatementsPage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <button className="hamburger-btn" onClick