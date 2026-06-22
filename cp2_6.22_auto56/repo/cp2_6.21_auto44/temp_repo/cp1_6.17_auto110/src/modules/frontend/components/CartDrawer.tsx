import { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const [showCheckout, setShowCheckout] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.record.price * item.quantity, 0);

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handleConfirmCheckout = () => {
    clearCart();
    setShowCheckout(false);
    onClose();
    navigate('/');
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${open ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>购物车</h2>
          <button className="cart-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={32} color="#999" />
            <span style={{ marginLeft: 8 }}>购物车是空的</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.record.id}>
                  <div className="cart-item-cover">
                    <img src={item.record.coverUrl} alt={item.record.title} />
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.record.title}</div>
                    <div className="cart-item-price">¥{item.record.price.toFixed(2)}</div>
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item.record.id);
                          } else {
                            updateQuantity(item.record.id, item.quantity - 1);
                          }
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="qty-num">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.record.id, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span className="cart-total-label">合计</span>
                <span className="cart-total-price">¥{total.toFixed(2)}</span>
              </div>
              <button className="btn-checkout" onClick={handleCheckout}>
                去结算
              </button>
            </div>
          </>
        )}
      </div>

      <div className={`modal-overlay ${showCheckout ? 'open' : ''}`}>
        <div className="modal">
          <div className="checkout-modal">
            <div className="checkout-icon">
              <CheckCircle size={36} />
            </div>
            <div className="checkout-title">结算成功</div>
            <div className="checkout-desc">感谢您的购买！订单已提交，唱片将尽快发货。</div>
            <button className="btn-submit" onClick={handleConfirmCheckout}>
              确定
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
