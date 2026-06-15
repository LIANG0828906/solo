import { useState, useMemo, useRef } from 'react';
import { Minus, Plus, X, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/api';
import type { Order, OrderItem } from '@/types';

interface OrderPanelProps {
  onOrderCreated: (order: Order) => void;
}

export default function OrderPanel({ onOrderCreated }: OrderPanelProps) {
  const items = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartBounce = useCartStore((state) => state.cartBounce);
  const clearCart = useCartStore((state) => state.clearCart);

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showTimeError, setShowTimeError] = useState(false);
  const errorTimeoutRef = useRef<number | null>(null);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const now = new Date();
    const minutes = now.getMinutes();
    const remainder = minutes % 15;
    const nextSlot = new Date(now);
    nextSlot.setMinutes(minutes + (15 - remainder));
    nextSlot.setSeconds(0);
    nextSlot.setMilliseconds(0);

    const endTime = new Date(now.getTime() + 30 * 60 * 1000);

    let currentSlot = new Date(nextSlot);
    while (currentSlot <= endTime) {
      const hours = currentSlot.getHours().toString().padStart(2, '0');
      const mins = currentSlot.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${mins}`);
      currentSlot = new Date(currentSlot.getTime() + 15 * 60 * 1000);
    }

    return slots;
  }, []);

  const total = getTotal();
  const totalItems = getTotalItems();

  const triggerTimeError = () => {
    setShowTimeError(true);
    if (errorTimeoutRef.current) {
      window.clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = window.setTimeout(() => {
      setShowTimeError(false);
    }, 300);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    if (!selectedTime) {
      triggerTimeError();
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const order = await createOrder({
        items: orderItems,
        pickupTime: selectedTime,
        total,
      });

      setCreatedOrder(order);
      setShowConfirmation(true);
      onOrderCreated(order);
      clearCart();
    } catch (error) {
      console.error('下单失败:', error);
      alert(error instanceof Error ? error.message : '下单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setCreatedOrder(null);
    setSelectedTime('');
  };

  if (!isCartOpen && totalItems === 0) {
    return null;
  }

  return (
    <>
      {totalItems > 0 && (
        <div className="cart-bar" onClick={() => setCartOpen(true)}>
          <div className="cart-bar-inner">
            <div className="cart-bar-left">
              <div className={`cart-icon-wrapper ${cartBounce ? 'bounce' : ''}`}>
                <ShoppingCart size={24} color="#8B4513" />
                <span className="cart-badge" key={totalItems}>
                  {totalItems}
                </span>
              </div>
              <span className="cart-total">¥{total}</span>
            </div>
            <button className="cart-view-btn" onClick={() => setCartOpen(true)}>
              去结算
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <>
          <div
            className="cart-panel-overlay"
            onClick={() => setCartOpen(false)}
          />
          <div className="cart-panel">
            <div className="cart-panel-header">
              <h2 className="cart-panel-title">购物车</h2>
              <button
                className="cart-panel-close"
                onClick={() => setCartOpen(false)}
                aria-label="关闭购物车"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cart-items-list">
              {items.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <p>购物车是空的</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menuItemId} className="cart-item">
                    <div className="cart-item-image">
                      <img src={item.image_url} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">¥{item.price}</span>
                    </div>
                    <div className="cart-item-actions">
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity - 1)
                        }
                        aria-label="减少数量"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity-value" key={item.quantity}>
                        {item.quantity}
                      </span>
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          updateQuantity(item.menuItemId, item.quantity + 1)
                        }
                        aria-label="增加数量"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="cart-item-subtotal">
                      ¥{item.price * item.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="cart-panel-footer">
              <div className={`time-selector-section ${showTimeError ? 'time-selector-error' : ''}`}>
                <p className="time-selector-label">选择取餐时间</p>
                <div className="time-slots">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${showTimeError ? 'error-flash' : ''}`}
                      onClick={() => {
                        setSelectedTime(slot);
                        setShowTimeError(false);
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cart-total-row">
                <span>合计</span>
                <span>¥{total}</span>
              </div>

              <button
                className="submit-order-btn"
                onClick={handleSubmitOrder}
                disabled={items.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    提交中...
                  </>
                ) : (
                  '提交订单'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {showConfirmation && createdOrder && (
        <div className="modal-overlay" onClick={handleCloseConfirmation}>
          <div
            className="confirmation-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirmation-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="confirmation-title">下单成功！</h2>
            <p className="confirmation-info">您的订单已提交</p>
            <div className="confirmation-id">订单号：{createdOrder.id.slice(0, 8).toUpperCase()}</div>
            <p className="confirmation-time">预计取餐时间：{createdOrder.pickupTime}</p>
            <button
              className="confirmation-btn"
              onClick={handleCloseConfirmation}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
