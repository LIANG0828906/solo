import { useState, useEffect, useCallback } from 'react';
import MenuPanel from './components/MenuPanel';
import OrderDesk from './components/OrderDesk';
import PetZone from './components/PetZone';
import type { MenuItem, Order, Notification } from './types';

const App = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [petJumpTrigger, setPetJumpTrigger] = useState(0);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(data);
    } catch (e) {
      console.error('加载菜单失败', e);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error('加载订单失败', e);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    fetchOrders();
  }, [fetchMenu, fetchOrders]);

  const addNotification = useCallback((message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2500);
  }, []);

  const activeOrderCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'making'
  ).length;

  const triggerPetJump = useCallback(() => {
    setPetJumpTrigger((prev) => prev + 1);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5E6CC',
        padding: '16px',
        position: 'relative'
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#6B4226',
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '20px',
          textShadow: '1px 1px 2px rgba(107, 66, 38, 0.2)'
        }}
      >
        ☕ 喵汪咖啡馆 · 管理系统 🐾
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          maxWidth: '1400px',
          margin: '0 auto',
          flexDirection: 'row'
        }}
      >
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <MenuPanel menu={menu} onMenuChange={fetchMenu} />
          <OrderDesk
            menu={menu}
            orders={orders}
            onOrdersChange={fetchOrders}
            onAddNotification={addNotification}
            onOrderComplete={triggerPetJump}
          />
        </div>

        <div style={{ flex: '0 0 calc(40% - 16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PetZone activeOrderCount={activeOrderCount} jumpTrigger={petJumpTrigger} />

          <div
            style={{
              backgroundColor: '#E8D5B7',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(139, 94, 60, 0.15)',
              maxHeight: '500px',
              overflowY: 'auto'
            }}
          >
            <h3
              style={{
                color: '#6B4226',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '12px',
                position: 'sticky',
                top: 0,
                backgroundColor: '#E8D5B7',
                paddingBottom: '8px'
              }}
            >
              📋 订单队列
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.length === 0 && (
                <p style={{ color: '#8B7355', textAlign: 'center', padding: '20px' }}>
                  暂无订单
                </p>
              )}
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: order.status === 'completed' ? '#C8E6C9' : '#FFF8F0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: order.status === 'making' ? '2px solid #FFB74D' : 'none',
                    transition: 'all 0.3s ease',
                    opacity: order.status === 'completed' ? 0.8 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#6B4226' }}>
                      {order.tableNumber}号桌
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor:
                          order.status === 'pending'
                            ? '#FFE0B2'
                            : order.status === 'making'
                            ? '#FFCC80'
                            : '#A5D6A7',
                        color: '#5D4037',
                        fontWeight: 600
                      }}
                    >
                      {order.status === 'pending' ? '待制作' : order.status === 'making' ? '制作中' : '✅ 已完成'}
                    </span>
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#6D4C41' }}>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: 'linear-gradient(135deg, rgba(139, 94, 60, 0.85), rgba(107, 66, 38, 0.9))',
              backdropFilter: 'blur(10px)',
              color: '#FFF8F0',
              padding: '12px 24px',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(107, 66, 38, 0.4)',
              fontSize: '14px',
              fontWeight: 600,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
              animation: 'slideInRight 0.4s ease forwards, slideOutLeft 0.4s ease 2.1s forwards',
              whiteSpace: 'nowrap'
            }}
          >
            🔔 {n.message}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="flex-direction: row"][style*="gap: 16px"] {
            flex-direction: column !important;
          }
          div[style*="flex: 0 0 60%"] {
            flex: none !important;
            width: 100% !important;
          }
          div[style*="flex: 0 0 calc(40%"] {
            flex: none !important;
            width: 100% !important;
          }
          div[style*="max-height: 500px"] {
            max-height: 350px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
