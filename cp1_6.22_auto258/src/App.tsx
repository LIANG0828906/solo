import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import {
  connect,
  onOrderUpdate,
  onOrderDelete,
  onFabricAlert,
  disconnect,
  onConnectionChange,
  isConnected,
} from './webSocketClient';
import { fetchOrders } from './orderManager';
import { fetchFabrics } from './fabricInventory';
import type { Order, Fabric, DashboardStats } from './types';
import NavBar from './components/NavBar';
import StatCard from './components/StatCard';
import OrderCard from './components/OrderCard';
import FabricTable from './components/FabricTable';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionClass, setTransitionClass] = useState('');

  useEffect(() => {
    setTransitionClass('page-enter');
    const timer1 = setTimeout(() => setTransitionClass('page-enter-active'), 10);
    const timer2 = setTimeout(() => setTransitionClass(''), 310);

    setDisplayChildren(children);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, children]);

  return <div className={transitionClass} style={pageTransitionStyle}>{displayChildren}</div>;
}

function DashboardPage({
  stats,
  orders,
  onStatusChange,
}: {
  stats: DashboardStats;
  orders: Order[];
  onStatusChange: (order: Order) => void;
}) {
  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>仪表盘</h1>
      <div style={statsContainerStyle} className="stats-container">
        <StatCard title="总订单数" value={stats.totalOrders} iconType="orders" />
        <StatCard title="生产中" value={stats.inProductionOrders} iconType="production" />
        <StatCard title="库存不足" value={stats.lowStockFabrics} iconType="stock" />
      </div>
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>最新订单</h2>
        <div style={ordersGridStyle} className="orders-grid">
          {orders.slice(0, 6).map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersPage({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange: (order: Order) => void;
}) {
  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>订单管理</h1>
      <div style={ordersGridStyle} className="orders-grid">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

function FabricsPage({ fabrics }: { fabrics: Fabric[] }) {
  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>面料库存</h1>
      <FabricTable fabrics={fabrics} />
    </div>
  );
}

function AppContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    inProductionOrders: 0,
    lowStockFabrics: 0,
  });
  const [wsConnected, setWsConnected] = useState(isConnected());
  const [isLoading, setIsLoading] = useState(true);

  const updateStats = useCallback((currentOrders: Order[], currentFabrics: Fabric[]) => {
    setStats({
      totalOrders: currentOrders.length,
      inProductionOrders: currentOrders.filter((o) => o.status === '生产中').length,
      lowStockFabrics: currentFabrics.filter((f) => f.totalMeters < f.threshold).length,
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, fabricsRes] = await Promise.all([
          fetchOrders(1, 100),
          fetchFabrics(),
        ]);
        setOrders(ordersRes.data);
        setFabrics(fabricsRes);
        updateStats(ordersRes.data, fabricsRes);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    connect();

    const unsubscribeOrder = onOrderUpdate((order) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === order.id);
        let updated: Order[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = order;
        } else {
          updated = [order, ...prev];
        }
        updateStats(updated, fabrics);
        return updated;
      });
    });

    const handleOrderDeleted = (orderId: string) => {
      setOrders((prev) => {
        const updated = prev.filter((o) => o.id !== orderId);
        updateStats(updated, fabrics);
        return updated;
      });
    };

    const unsubscribeFabric = onFabricAlert((alert) => {
      setFabrics((prev) => {
        const index = prev.findIndex((f) => f.id === alert.fabricId);
        let updated: Fabric[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = { ...updated[index], totalMeters: alert.currentStock };
        } else {
          return prev;
        }
        updateStats(orders, updated);
        return updated;
      });
    });

    const unsubscribeDelete = onOrderDelete(handleOrderDeleted);

    const unsubscribeConnection = onConnectionChange((connected) => {
      setWsConnected(connected);
    });

    return () => {
      unsubscribeOrder();
      unsubscribeDelete();
      unsubscribeFabric();
      unsubscribeConnection();
      disconnect();
    };
  }, [updateStats]);

  const handleStatusChange = useCallback(
    (updatedOrder: Order) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === updatedOrder.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = updatedOrder;
          updateStats(updated, fabrics);
          return updated;
        }
        return prev;
      });
    },
    [fabrics, updateStats]
  );

  if (isLoading) {
    return (
      <div style={loadingStyle}>
        <div style={loadingSpinnerStyle} />
        <div style={loadingTextStyle}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <NavBar />
      <div style={mainStyle} className="main-content">
        <header style={headerStyle} className="header-content">
          <div style={headerTitleStyle}>定制工坊管理台</div>
          <div style={wsStatusStyle} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 已断开'}>
            <div
              style={{
                ...wsDotStyle,
                backgroundColor: wsConnected ? '#27AE60' : '#E74C3C',
                ...(wsConnected ? wsDotPulseStyle : {}),
              }}
            />
            <span style={wsTextStyle}>{wsConnected ? '已连接' : '已断开'}</span>
          </div>
        </header>
        <main style={contentStyle} className="page-content">
          <PageTransition>
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardPage
                    stats={stats}
                    orders={orders}
                    onStatusChange={handleStatusChange}
                  />
                }
              />
              <Route
                path="/orders"
                element={<OrdersPage orders={orders} onStatusChange={handleStatusChange} />}
              />
              <Route path="/fabrics" element={<FabricsPage fabrics={fabrics} />} />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const appStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#F5F7FA',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  marginLeft: '200px',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 32px',
  backgroundColor: '#FFFFFF',
  borderBottom: '1px solid #E0E0E0',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#333333',
};

const wsStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const wsDotStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  transition: 'background-color 0.3s ease',
};

const wsDotPulseStyle: React.CSSProperties = {
  animation: 'pulse 2s infinite',
};

const wsTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666666',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px 32px',
  overflowX: 'hidden',
};

const pageTransitionStyle: React.CSSProperties = {
  width: '100%',
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#333333',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#333333',
};

const ordersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
  width: '100%',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  gap: '16px',
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid #E0E0E0',
  borderTopColor: '#3498DB',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
};

export default App;
