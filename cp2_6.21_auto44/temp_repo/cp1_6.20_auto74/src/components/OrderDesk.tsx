import { useState } from 'react';
import type { MenuItem, Order, OrderItem } from '../types';

interface OrderDeskProps {
  menu: MenuItem[];
  orders: Order[];
  onOrdersChange: () => void;
  onAddNotification: (msg: string) => void;
  onOrderComplete: () => void;
}

const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
  const button = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple';
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

const OrderDesk = ({ menu, orders, onOrdersChange, onAddNotification, onOrderComplete }: OrderDeskProps) => {
  const [showPanel, setShowPanel] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const availableMenu = menu.filter((m) => m.available);

  const resetPanel = () => {
    setShowPanel(false);
    setSelectedTable(null);
    setOrderItems([]);
  };

  const toggleMenuItem = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev
          .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeOrderItem = (id: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmitOrder = async () => {
    if (selectedTable === null || orderItems.length === 0) return;

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: selectedTable,
          items: orderItems
        })
      });
      onOrdersChange();
      onAddNotification(`${selectedTable}号桌已下单，共${totalItems}项`);
      resetPanel();
    } catch (e) {
      console.error('创建订单失败', e);
    }
  };

  const handleStartMaking = async (id: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'making' })
      });
      onOrdersChange();
    } catch (e) {
      console.error('更新订单失败', e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      onOrdersChange();
      onOrderComplete();
    } catch (e) {
      console.error('完成订单失败', e);
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { pending: 0, making: 1, completed: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div
      style={{
        backgroundColor: '#FFF8F0',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(139, 94, 60, 0.15)'
      }}
    >
      <div
        style={{
          backgroundColor: '#8B5E3C',
          color: '#FFF8F0',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>💵 收银台</h2>
        <button
          onClick={(e) => {
            createRipple(e);
            setShowPanel(true);
          }}
          className="ripple-effect"
          style={{
            backgroundColor: '#FFB74D',
            color: '#4E342E',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(255, 183, 77, 0.4)'
          }}
        >
          + 新订单
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {sortedOrders.filter((o) => o.status !== 'completed').length === 0 ? (
            <p style={{ color: '#8B7355', textAlign: 'center', padding: '24px' }}>
              当前没有待处理订单 🎉
            </p>
          ) : (
            sortedOrders
              .filter((o) => o.status !== 'completed')
              .map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFBF5',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 2px 6px rgba(139, 94, 60, 0.1)',
                    border: order.status === 'making' ? '2px solid #FFB74D' : '2px solid transparent',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 94, 60, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 94, 60, 0.1)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 800,
                      color: '#8B5E3C',
                      minWidth: '60px',
                      textAlign: 'center',
                      lineHeight: 1
                    }}
                  >
                    {order.tableNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#8B7355', marginBottom: '4px' }}>
                      {order.status === 'pending' ? '⏳ 待制作' : '👨‍🍳 制作中'}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {order.items.map((item) => (
                        <li key={item.id} style={{ fontSize: '14px', color: '#4A3728', paddingLeft: '12px', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#8B5E3C' }}>•</span>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          createRipple(e);
                          handleStartMaking(order.id);
                        }}
                        className="ripple-effect"
                        style={{
                          backgroundColor: '#FFB74D',
                          color: '#4E342E',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '16px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '13px',
                          boxShadow: '0 2px 6px rgba(255, 183, 77, 0.3)'
                        }}
                      >
                        制作中
                      </button>
                    )}
                    {order.status === 'making' && (
                      <button
                        onClick={(e) => {
                          createRipple(e);
                          handleComplete(order.id);
                        }}
                        className="ripple-effect"
                        style={{
                          backgroundColor: '#66BB6A',
                          color: '#FFF',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '16px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '13px',
                          boxShadow: '0 2px 6px rgba(102, 187, 106, 0.3)'
                        }}
                      >
                        ✓ 完成
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {showPanel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '100%',
            maxWidth: '480px',
            height: '100vh',
            backgroundColor: '#FFFBF5',
            boxShadow: '-8px 0 24px rgba(139, 94, 60, 0.2)',
            zIndex: 100,
            animation: 'slideInRight 0.35s ease',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              backgroundColor: '#8B5E3C',
              color: '#FFF8F0',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📝 创建新订单</h3>
            <button
              onClick={(e) => {
                createRipple(e);
                resetPanel();
              }}
              className="ripple-effect"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFF8F0',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0 8px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '10px', color: '#6B4226' }}>
                选择桌号
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    onClick={(e) => {
                      createRipple(e);
                      setSelectedTable(num);
                    }}
                    className="ripple-effect"
                    style={{
                      aspectRatio: '1',
                      borderRadius: '16px',
                      border: selectedTable === num ? '3px solid #FFB74D' : '2px solid #D7C4A5',
                      backgroundColor: selectedTable === num ? '#FFF3E0' : '#FFFBF5',
                      color: selectedTable === num ? '#E65100' : '#6B4226',
                      fontSize: '24px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transform: selectedTable === num ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedTable === num ? '0 4px 12px rgba(255, 183, 77, 0.4)' : 'none'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '10px', color: '#6B4226' }}>
                选择菜品
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {availableMenu.map((item) => {
                  const selected = orderItems.find((i) => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectedTable !== null && toggleMenuItem(item)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: selected ? '#FFE0B2' : '#FFF8F0',
                        border: selected ? '2px solid #FFB74D' : '2px solid transparent',
                        cursor: selectedTable === null ? 'not-allowed' : 'pointer',
                        opacity: selectedTable === null ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#4A3728' }}>
                          {item.type === 'drink' ? '🥤' : '🍰'} {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8B7355' }}>
                          {item.type === 'drink'
                            ? item.category === 'coffee'
                              ? '咖啡'
                              : item.category === 'tea'
                              ? '茶饮'
                              : '特调'
                            : item.hasGluten
                            ? '含麸质'
                            : '无麸质'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#D2691E' }}>¥{item.price}</span>
                        {selected && (
                          <span
                            style={{
                              backgroundColor: '#FFB74D',
                              color: '#4E342E',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}
                          >
                            {selected.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '2px solid #D7C4A5',
              padding: '14px 20px',
              backgroundColor: '#FFF8F0'
            }}
          >
            {orderItems.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#8B7355', marginBottom: '6px', fontWeight: 600 }}>订单摘要</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {orderItems.map((item) => (
                    <span
                      key={item.id}
                      style={{
                        background: 'linear-gradient(135deg, #FFB74D, #FF8A65)',
                        color: '#FFF',
                        padding: '4px 10px 4px 12px',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(255, 138, 101, 0.3)'
                      }}
                    >
                      {item.name} ×{item.quantity}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createRipple(e as React.MouseEvent<HTMLButtonElement>);
                          removeOrderItem(item.id);
                        }}
                        className="ripple-effect"
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          color: '#FFF',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#6B4226' }}>
                <span style={{ fontWeight: 600 }}>共 {totalItems} 项</span>
                <span style={{ margin: '0 12px', color: '#D7C4A5' }}>|</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#D2691E' }}>¥{totalPrice}</span>
              </div>
              <button
                onClick={(e) => {
                  createRipple(e);
                  handleSubmitOrder();
                }}
                disabled={selectedTable === null || orderItems.length === 0}
                className="ripple-effect"
                style={{
                  backgroundColor: selectedTable !== null && orderItems.length > 0 ? '#66BB6A' : '#BDBDBD',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '22px',
                  fontWeight: 700,
                  cursor: selectedTable !== null && orderItems.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                  boxShadow: selectedTable !== null && orderItems.length > 0 ? '0 4px 12px rgba(102, 187, 106, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                确认下单
              </button>
            </div>
          </div>
        </div>
      )}

      {showPanel && (
        <div
          onClick={resetPanel}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 'calc(100% - 480px)',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 99,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
    </div>
  );
};

export default OrderDesk;
