import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useFilteredMenuItems } from '../store/useAppStore';
import { Category } from '../shared/types';
import { MenuCard } from '../components/MenuCard';
import { RoleSwitcher } from '../components/RoleSwitcher';
import './CustomerScreen.css';

const categories: { key: Category; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'burger', label: '汉堡' },
  { key: 'snack', label: '小食' },
  { key: 'drink', label: '饮品' }
];

export const CustomerScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const navigate = useNavigate();
  const loadMenuItems = useAppStore(state => state.loadMenuItems);
  const cartItems = useAppStore(state => state.cartItems);
  const updateCartItemQuantity = useAppStore(state => state.updateCartItemQuantity);
  const removeFromCart = useAppStore(state => state.removeFromCart);
  const getCartTotal = useAppStore(state => state.getCartTotal);
  const getCartItemCount = useAppStore(state => state.getCartItemCount);
  const submitOrder = useAppStore(state => state.submitOrder);
  const isLoading = useAppStore(state => state.isLoading);

  const filteredItems = useFilteredMenuItems(activeCategory);
  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const isFreeDelivery = total >= 30;

  useEffect(() => {
    loadMenuItems();
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [loadMenuItems]);

  const handleSubmitOrder = async () => {
    const order = await submitOrder();
    if (order) {
      navigate(`/order-confirmation/${order.id}`);
    }
  };

  const handleQuantityChange = (menuItemId: string, delta: number) => {
    const item = cartItems.find(c => c.menuItemId === menuItemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeFromCart(menuItemId);
      } else {
        updateCartItemQuantity(menuItemId, newQuantity);
      }
    }
  };

  const renderCartPanel = () => (
    <div className={`cart-panel ${isMobile && !isCartExpanded ? 'collapsed' : ''}`}>
      {isMobile && !isCartExpanded ? (
        <button className="cart-float-bar" onClick={() => setIsCartExpanded(true)}>
          <span className="material-icons">shopping_bag</span>
          <span className="cart-float-count">{itemCount} 件商品</span>
          <span className="cart-float-total">¥{total.toFixed(2)}</span>
          <span className="material-icons">expand_less</span>
        </button>
      ) : (
        <>
          {isMobile && (
            <div className="cart-mobile-header">
              <button className="cart-close-btn" onClick={() => setIsCartExpanded(false)}>
                <span className="material-icons">expand_more</span>
              </button>
            </div>
          )}
          
          <div className="cart-header">
            <span className="material-icons cart-icon">shopping_bag</span>
            <h2 className="cart-title">购物车</h2>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="cart-empty">暂无商品，去点餐吧</p>
            ) : (
              cartItems.map(item => (
                <div key={item.menuItemId} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-emoji">{item.emoji}</span>
                    <div className="cart-item-details">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-price">¥{item.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.menuItemId, -1)}
                    >
                      <span className="material-icons">remove</span>
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.menuItemId, 1)}
                    >
                      <span className="material-icons">add</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>小计</span>
              <span className="subtotal-amount">¥{total.toFixed(2)}</span>
            </div>
            {isFreeDelivery && (
              <div className="free-delivery">
                <span className="material-icons">check_circle</span>
                <span>已达免配送费</span>
              </div>
            )}
            <button
              className="checkout-btn"
              disabled={cartItems.length === 0}
              onClick={handleSubmitOrder}
            >
              去结算
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="customer-screen">
      <header className="customer-header">
        <div className="header-left">
          <h1 className="app-logo">OrderFlow</h1>
          <p className="app-subtitle">欢迎光临，请开始点餐</p>
        </div>
        <RoleSwitcher />
      </header>

      <main className="customer-main">
        <div className="menu-section">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="loading-state">
              <span className="material-icons loading-icon">hourglass_empty</span>
              <p>加载中...</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map(item => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {renderCartPanel()}
      </main>

      {isMobile && isCartExpanded && (
        <div className="cart-overlay" onClick={() => setIsCartExpanded(false)} />
      )}
    </div>
  );
};
