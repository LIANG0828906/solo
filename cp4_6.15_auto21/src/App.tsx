import { useState, useEffect, useCallback } from 'react';
import type { Book, Order, OrderStatus, Promotion, Toast, TabType } from './types';
import {
  loadFromStorage,
  saveToStorage,
  generateMockBooks,
  generateMockOrders,
  generateMockPromotions,
  validatePromoCode
} from './utils';
import DashboardModule from './DashboardModule';
import BooksModule from './BooksModule';
import OrdersModule from './OrdersModule';
import PromotionsModule from './PromotionsModule';

const App = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const storedBooks = loadFromStorage<Book[]>('books', []);
    const storedOrders = loadFromStorage<Order[]>('orders', []);
    const storedPromotions = loadFromStorage<Promotion[]>('promotions', []);

    if (storedBooks.length === 0 && storedOrders.length === 0 && storedPromotions.length === 0) {
      const mockBooks = generateMockBooks();
      const mockOrders = generateMockOrders(mockBooks);
      const mockPromotions = generateMockPromotions();
      setBooks(mockBooks);
      setOrders(mockOrders);
      setPromotions(mockPromotions);
      saveToStorage('books', mockBooks);
      saveToStorage('orders', mockOrders);
      saveToStorage('promotions', mockPromotions);
    } else {
      setBooks(storedBooks);
      setOrders(storedOrders);
      setPromotions(storedPromotions);
    }
  }, []);

  useEffect(() => {
    saveToStorage('books', books);
  }, [books]);

  useEffect(() => {
    saveToStorage('orders', orders);
  }, [orders]);

  useEffect(() => {
    saveToStorage('promotions', promotions);
  }, [promotions]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } as Toast : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const addBook = useCallback((book: Book) => {
    setBooks(prev => [...prev, book]);
  }, []);

  const updateBook = useCallback((book: Book) => {
    setBooks(prev => prev.map(b => b.id === book.id ? book : b));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));
  }, []);

  const applyPromoCode = useCallback((orderId: string, code: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const result = validatePromoCode(code, order.totalAmount, promotions);
    if (!result.valid) {
      showToast(result.message, 'error');
      return;
    }

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? {
            ...o,
            promoCode: code,
            discountAmount: result.discountAmount,
            finalAmount: Math.max(0, o.totalAmount - result.discountAmount)
          }
        : o
    ));

    setPromotions(prev => prev.map(p =>
      p.code === code
        ? { ...p, usedCount: p.usedCount + 1 }
        : p
    ));

    showToast(result.message, 'success');
  }, [orders, promotions, showToast]);

  const addPromotion = useCallback((promotion: Promotion) => {
    setPromotions(prev => [...prev, promotion]);
  }, []);

  const deletePromotion = useCallback((id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  }, []);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: '数据看板' },
    { key: 'books', label: '书籍管理' },
    { key: 'orders', label: '订单管理' },
    { key: 'promotions', label: '促销活动' }
  ];

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardModule books={books} orders={orders} />;
      case 'books':
        return (
          <BooksModule
            books={books}
            promotions={promotions}
            onAddBook={addBook}
            onUpdateBook={updateBook}
            onDeleteBook={deleteBook}
            onShowToast={showToast}
          />
        );
      case 'orders':
        return (
          <OrdersModule
            orders={orders}
            promotions={promotions}
            onUpdateOrderStatus={updateOrderStatus}
            onApplyPromoCode={applyPromoCode}
            onShowToast={showToast}
          />
        );
      case 'promotions':
        return (
          <PromotionsModule
            promotions={promotions}
            onAddPromotion={addPromotion}
            onDeletePromotion={deletePromotion}
            onShowToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>📚 社区微书店管理系统</h1>
          <nav className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {renderModule()}
      </main>

      {toasts.length > 0 && (
        <div className="toasts-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast ${toast.type} ${(toast as { leaving?: boolean }).leaving ? 'leaving' : ''}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
