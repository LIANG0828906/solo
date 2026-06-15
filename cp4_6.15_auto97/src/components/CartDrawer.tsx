import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export default function CartDrawer() {
  const { cart, cartOpen, toggleCart, updateCartQuantity, removeFromCart, user } = useStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  const handleCheckout = () => {
    toggleCart(false);
    navigate('/cart');
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => toggleCart(false)}></div>
      <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">购物车 ({cart.length})</h2>
          <button className="cart-close" onClick={() => toggleCart(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <p>购物车是空的</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => toggleCart(false)}>
                去逛逛
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.bookId}>
                <img 
                  src={item.book.coverUrl} 
                  alt={item.book.title} 
                  className="cart-item-image"
                />
                <div className="cart-item-info">
                  <div>
                    <p className="cart-item-title">{item.book.title}</p>
                    <p className="cart-item-price">¥{item.book.price.toFixed(2)}</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartQuantity(item.bookId, item.quantity - 1);
                      }}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartQuantity(item.bookId, item.quantity + 1);
                      }}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button 
                      className="quantity-btn"
                      style={{ color: '#F44336' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.bookId);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">总计</span>
              <span className="cart-total-value">¥{total.toFixed(2)}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={handleCheckout}
            >
              {user ? '去结算' : '登录后结算'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
