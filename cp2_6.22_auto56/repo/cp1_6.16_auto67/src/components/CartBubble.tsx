import { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CartBubbleProps {
  cart: CartItem[];
  itemCount: number;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
  onPlaceOrder: (items: CartItem[]) => void;
}

export default function CartBubble({ cart, itemCount, onUpdateQuantity, onRemove, onPlaceOrder }: CartBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bounceTrigger, setBounceTrigger] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (itemCount > 0) {
      setBounceTrigger(true);
      const timer = setTimeout(() => setBounceTrigger(false), 500);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = () => {
    setShowConfirmModal(true);
  };

  const confirmOrder = () => {
    onPlaceOrder(cart);
    setShowConfirmModal(false);
    setIsOpen(false);
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 2000);
  };

  const handleQuantityChange = (menuItemId: string, delta: number) => {
    const item = cart.find(i => i.menuItemId === menuItemId);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        onRemove(menuItemId);
      } else {
        onUpdateQuantity(menuItemId, newQty);
      }
    }
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  return (
    <>
      <div
        style={{
          ...styles.bubble,
          ...(bounceTrigger ? styles.bubbleBounce : {})
        }}
        className={bounceTrigger ? 'animate-bounce-once' : ''}
        onClick={() => itemCount > 0 && setIsOpen(true)}
      >
        <span style={styles.cartIcon}>🛒</span>
        {itemCount > 0 && (
          <span style={styles.badge}>{itemCount}</span>
        )}
      </div>

      {isOpen && (
        <div style={styles.overlay} onClick={() => setIsOpen(false)}>
          <div
            style={styles.panel}
            className="animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>购物车</h3>
              <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <div style={styles.emptyIcon}>🛒</div>
                <p style={styles.emptyText}>购物车是空的</p>
              </div>
            ) : (
              <>
                <div style={styles.cartList}>
                  {cart.map((item, index) => (
                    <div
                      key={item.menuItemId}
                      className="stagger-item"
                      style={{
                        ...styles.cartItem,
                        animationDelay: `${index * 0.05}s`
                      }}
                    >
                      <img src={item.image} alt={item.name} style={styles.itemImage} />
                      <div style={styles.itemInfo}>
                        <h4 style={styles.itemName}>{item.name}</h4>
                        <span style={styles.itemPrice}>¥{item.price}</span>
                      </div>
                      <div style={styles.quantityControl}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => handleQuantityChange(item.menuItemId, -1)}
                        >
                          −
                        </button>
                        <span style={styles.qtyValue}>{item.quantity}</span>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => handleQuantityChange(item.menuItemId, 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => onRemove(item.menuItemId)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div style={styles.panelFooter}>
                  <div style={styles.totalSection}>
                    <span style={styles.totalLabel}>合计</span>
                    <span style={styles.totalPrice}>
                      <span style={styles.priceSymbol}>¥</span>
                      {totalPrice}
                    </span>
                  </div>
                  <button style={styles.checkoutBtn} onClick={handlePlaceOrder}>
                    确认下单
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div
            style={styles.confirmModal}
            className="animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>确认下单</h3>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>
                共 <strong>{itemCount}</strong> 件商品
              </p>
              <p style={styles.modalTotal}>
                合计: <span style={styles.modalPrice}>¥{totalPrice}</span>
              </p>
              <p style={styles.modalHint}>下单后订单将进入制作队列</p>
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowConfirmModal(false)}
              >
                取消
              </button>
              <button
                style={styles.confirmBtn}
                onClick={confirmOrder}
              >
                确认下单
              </button>
            </div>
          </div>
        </div>
      )}

      {orderPlaced && (
        <div style={styles.toast}>
          <span style={styles.toastIcon}>✓</span>
          <span>下单成功！</span>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bubble: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    boxShadow: '0 4px 16px rgba(232, 93, 44, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 100,
    transition: 'transform 0.2s ease'
  },
  bubbleBounce: {
    animation: 'bounce 0.5s ease-out'
  },
  cartIcon: {
    fontSize: '28px'
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '22px',
    height: '22px',
    borderRadius: '11px',
    backgroundColor: '#E74C3C',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  panel: {
    width: '100%',
    maxWidth: '400px',
    height: '100%',
    backgroundColor: '#FFF8EE',
    display: 'flex',
    flexDirection: 'column'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)'
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'white',
    margin: 0
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyCart: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '16px',
    color: '#8B7355'
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '10px',
    marginBottom: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  itemImage: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0
  },
  itemInfo: {
    flex: 1,
    minWidth: 0
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#3D2B1F',
    margin: '0 0 4px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  itemPrice: {
    fontSize: '14px',
    color: '#E85D2C',
    fontWeight: '600'
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#F4A261',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  qtyValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3D2B1F',
    minWidth: '20px',
    textAlign: 'center'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.6
  },
  panelFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: 'white'
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  totalLabel: {
    fontSize: '14px',
    color: '#8B7355'
  },
  totalPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#E85D2C'
  },
  priceSymbol: {
    fontSize: '16px',
    marginRight: '2px'
  },
  checkoutBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 44, 0.3)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: '20px'
  },
  confirmModal: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: '#FFF8EE',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#3D2B1F',
    margin: '0 0 20px 0',
    textAlign: 'center'
  },
  modalContent: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  modalText: {
    fontSize: '14px',
    color: '#5D4E37',
    marginBottom: '8px'
  },
  modalTotal: {
    fontSize: '16px',
    color: '#3D2B1F',
    marginBottom: '12px'
  },
  modalPrice: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#E85D2C'
  },
  modalHint: {
    fontSize: '12px',
    color: '#8B7355'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#E0D5C5',
    color: '#5D4E37',
    fontSize: '16px',
    fontWeight: '500',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer'
  },
  confirmBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 44, 0.3)'
  },
  toast: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    zIndex: 400,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'fadeIn 0.3s ease-out'
  },
  toastIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#2ECC71',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  }
};
