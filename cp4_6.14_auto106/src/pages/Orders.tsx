import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { OrderCard, statusLabels } from '../components/OrderCard';
import { ProductCard } from '../components/ProductCard';
import type { OrderStatus } from '../api';

const statusColors: Record<OrderStatus, string> = {
  pending: 'var(--color-warning)',
  processing: 'var(--color-info)',
  completed: 'var(--color-success)',
};

const allStatuses: OrderStatus[] = ['pending', 'processing', 'completed'];

export const Orders: React.FC = () => {
  const {
    orders,
    products,
    cart,
    fetchAll,
    updateOrderStatus,
    updateCartQuantity,
    removeFromCart,
    createOrder,
    clearCart,
  } = useStore();

  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDragOver = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      await updateOrderStatus(orderId, status);
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createOrder(customerName.trim());
      setCustomerName('');
      setShowCart(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in">
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
        <button className="btn btn-primary" onClick={() => setShowCart(true)}>
          🛒 创建订单 {cart.length > 0 && `(${cart.reduce((s, i) => s + i.quantity, 0)})`}
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          选择产品加入购物车创建新订单
        </div>
        <div className="product-grid" style={{ marginBottom: 8 }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showCart />
          ))}
        </div>
      </div>

      <div className="order-board">
        {allStatuses.map((status) => (
          <div
            key={status}
            className={`order-column ${dragOverStatus === status ? 'drag-over' : ''}`}
            data-status={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="order-column-header">
              <div className="order-column-title">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: statusColors[status],
                  }}
                />
                {statusLabels[status]}
              </div>
              <span className="order-column-count">
                {orders.filter((o) => o.status === status).length}
              </span>
            </div>
            {orders
              .filter((o) => o.status === status)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status={status}
                />
              ))}
          </div>
        ))}
      </div>

      {showCart && (
        <>
          <div
            onClick={() => setShowCart(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 150,
            }}
          />
          <div className="cart-sidebar">
            <div className="cart-sidebar-header">
              <div className="cart-sidebar-title">
                购物车 ({cart.reduce((s, i) => s + i.quantity, 0)})
              </div>
              <button className="cart-close-btn" onClick={() => setShowCart(false)}>
                ✕
              </button>
            </div>

            <div className="cart-sidebar-body">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🛒</div>
                  <div>购物车为空</div>
                  <div style={{ fontSize: 12 }}>从上方选择产品加入</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="cart-item-thumb"
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.productName}</div>
                      <div className="cart-item-price">¥{item.price.toFixed(2)}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-sidebar-footer">
                <form onSubmit={handleCheckout}>
                  <div className="form-group cart-checkout-form">
                    <label className="form-label">客户姓名</label>
                    <input
                      className="form-input"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="请输入客户姓名"
                      required
                    />
                  </div>
                  <div className="cart-total-row">
                    <span className="cart-total-label">合计</span>
                    <span className="cart-total-value">¥{cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => {
                        clearCart();
                        setShowCart(false);
                      }}
                    >
                      清空
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={submitting}
                    >
                      {submitting ? '提交中...' : '确认下单'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
