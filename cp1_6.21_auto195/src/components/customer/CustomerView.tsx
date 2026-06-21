import React, { useState } from 'react';
import { useMenu, MenuItem } from '../../context/MenuContext';
import { useOrders, OrderItem, Order } from '../../context/OrderContext';
import MenuCard from './MenuCard';
import CartPanel from './CartPanel';
import OrderForm from './OrderForm';
import OrderResult from './OrderResult';

interface CartItem extends OrderItem {
  image: string;
}

const CustomerView: React.FC = () => {
  const { state: menuState } = useMenu();
  const { createOrder, cancelOrder, state: orderState } = useOrders();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ];
    });
    setShowCart(true);
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.menuItemId === menuItemId
            ? { ...ci, quantity: Math.max(0, ci.quantity + delta) }
            : ci
        )
        .filter((ci) => ci.quantity > 0)
    );
  };

  const totalPrice = cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
  const totalItems = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const handleSubmitOrder = async (formData: {
    customerName: string;
    phone: string;
    estimatedArrival: string;
    notes: string;
  }) => {
    try {
      setError('');
      const orderItems: OrderItem[] = cart.map(({ image, ...rest }) => rest);
      const result = await createOrder({
        ...formData,
        items: orderItems,
      });
      setSubmittedOrder(result);
      setCart([]);
      setShowOrderForm(false);
      setShowCart(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      if (submittedOrder && submittedOrder.id === orderId) {
        const updated = orderState.orders.find((o) => o.id === orderId);
        if (updated) setSubmittedOrder(updated);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '32px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 340px)',
    gap: '24px',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '100%',
    },
  };

  const floatingCartStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 50,
  };

  const cartButtonStyle: React.CSSProperties = {
    background: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '50%',
    width: '64px',
    height: '64px',
    fontSize: '28px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
    position: 'relative',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const cartBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const errorStyle: React.CSSProperties = {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '0.5px solid #FECACA',
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const finalGridStyle = isMobile
    ? { ...gridStyle, gridTemplateColumns: '100%' }
    : gridStyle;

  return (
    <div>
      <h1 style={pageTitleStyle}>🌟 今日特价菜单</h1>
      <p style={subtitleStyle}>精选美食，限时优惠，在线预订更便捷</p>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {submittedOrder && (
        <OrderResult
          order={submittedOrder}
          onCancel={() => handleCancelOrder(submittedOrder.id)}
          onClose={() => setSubmittedOrder(null)}
        />
      )}

      {menuState.loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          🍳 正在加载菜单...
        </div>
      ) : (
        <div style={finalGridStyle}>
          {menuState.items.map((item, index) => (
            <div
              key={item.id}
              style={{ animationDelay: `${index * 0.05}s` }}
              className="animate-fade-in-up"
            >
              <MenuCard item={item} onAddToCart={() => addToCart(item)} />
            </div>
          ))}
        </div>
      )}

      {menuState.items.length === 0 && !menuState.loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            color: '#6B7280',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '0.5px solid #E5E7EB',
          }}
        >
          暂时没有特价菜品，敬请期待！
        </div>
      )}

      {totalItems > 0 && (
        <div style={floatingCartStyle} className="animate-pop-in">
          <button
            style={cartButtonStyle}
            onClick={() => setShowCart(true)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            🛒
            <span style={cartBadgeStyle}>{totalItems}</span>
          </button>
        </div>
      )}

      {showCart && (
        <CartPanel
          cart={cart}
          totalPrice={totalPrice}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={() => {
            setShowCart(false);
            setShowOrderForm(true);
          }}
        />
      )}

      {showOrderForm && (
        <OrderForm
          totalPrice={totalPrice}
          totalItems={totalItems}
          onClose={() => setShowOrderForm(false)}
          onSubmit={handleSubmitOrder}
          onBack={() => {
            setShowOrderForm(false);
            setShowCart(true);
          }}
        />
      )}
    </div>
  );
};

export default CustomerView;
