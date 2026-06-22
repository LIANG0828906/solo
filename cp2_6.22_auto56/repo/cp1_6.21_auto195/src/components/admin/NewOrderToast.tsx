import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';

const NewOrderToast: React.FC = () => {
  const { state, markOrderSeen } = useOrders();
  const [visible, setVisible] = useState(false);
  const [displayedIds, setDisplayedIds] = useState<string[]>([]);

  useEffect(() => {
    const newIds = state.newOrderIds.filter((id) => !displayedIds.includes(id));
    if (newIds.length > 0) {
      setVisible(true);
      setDisplayedIds((prev) => [...prev, ...newIds]);
      const timer = setTimeout(() => {
        setVisible(false);
        newIds.forEach((id) => markOrderSeen(id));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.newOrderIds, displayedIds, markOrderSeen]);

  if (!visible || state.newOrderIds.length === 0) return null;

  const latestId = state.newOrderIds[state.newOrderIds.length - 1];
  const order = state.orders.find((o) => o.id === latestId);
  if (!order) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999,
    animation: 'popIn 0.3s ease-out',
  };

  const toastStyle: React.CSSProperties = {
    background: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '20px',
    padding: '20px 24px',
    minWidth: '320px',
    maxWidth: '420px',
    boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4)',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  };

  const badgeStyle: React.CSSProperties = {
    background: '#FFFFFF',
    color: '#EF4444',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '4px',
  };

  const detailStyle: React.CSSProperties = {
    fontSize: '13px',
    opacity: 0.92,
    marginBottom: '4px',
  };

  const itemsStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.85,
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255,255,255,0.25)',
  };

  const itemsText = order.items
    .map((i) => `${i.name}×${i.quantity}`)
    .join('、');

  const clickHandler = () => {
    markOrderSeen(latestId);
    setVisible(false);
  };

  return (
    <div style={containerStyle}>
      <button
        style={toastStyle}
        onClick={clickHandler}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#DC2626';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#EF4444';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <div style={headerStyle}>
          <div>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>🔔</span>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>新订单！</span>
          </div>
          <span style={badgeStyle}>
            {state.newOrderIds.length > 1 ? `${state.newOrderIds.length} 条` : 'NEW'}
          </span>
        </div>
        <div style={titleStyle}>
          {order.customerName} · ¥{order.totalAmount.toFixed(2)}
        </div>
        <div style={detailStyle}>📱 {order.phone}</div>
        <div style={detailStyle}>
          ⏰ 到店时间：{new Date(order.estimatedArrival).getHours().toString().padStart(2, '0')}:
          {new Date(order.estimatedArrival).getMinutes().toString().padStart(2, '0')}
        </div>
        <div style={itemsStyle}>🍽️ {itemsText}</div>
      </button>
    </div>
  );
};

export default NewOrderToast;
