import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  const { cart, cartOpen, currentPage, setCartOpen, setCurrentPage, removeFromCart, updateQuantity, setCurrentPage: _sp } = useStore();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
  const [badgeBounce, setBadgeBounce] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setBadgeBounce(true);
      const t = setTimeout(() => setBadgeBounce(false), 500);
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  const renderPage = () => {
    switch (currentPage) {
      case 'checkout':
        return <Checkout />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Catalog />;
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setCurrentPage('catalog')}>
          🌿 花语速递
        </div>
        <div className="navbar-nav">
          <button
            className={`nav-link ${currentPage === 'catalog' ? 'active' : ''}`}
            onClick={() => setCurrentPage('catalog')}
          >
            花束目录
          </button>
          <button
            className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentPage('admin')}
          >
            配送管理
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒
            {totalItems > 0 && (
              <span className={`cart-badge ${badgeBounce ? 'bounce' : ''}`}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>

      {cartOpen && (
        <>
          <div className="cart-sidebar-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-sidebar">
            <div className="cart-sidebar-header">
              <h3>🛒 购物车</h3>
              <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🌷</div>
                <div>购物车还是空的</div>
                <div style={{ fontSize: 13, marginTop: 4, color: '#aaa' }}>去挑选一束花吧~</div>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.bouquet.id}>
                      <div
                        className="cart-item-emoji"
                        style={{ background: item.bouquet.color + '22' }}
                      >
                        {item.bouquet.emoji}
                      </div>
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.bouquet.name}</div>
                        <div className="cart-item-price">¥{(item.bouquet.price * item.quantity).toFixed(1)}</div>
                      </div>
                      <div className="cart-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.bouquet.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-num">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.bouquet.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.bouquet.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span className="cart-total-label">合计</span>
                    <span className="cart-total-price">{totalPrice.toFixed(1)}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setCartOpen(false);
                      setCurrentPage('checkout');
                    }}
                  >
                    去结算
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default App;
