import { useState, useEffect } from 'react';
import type { Order, DashboardStats } from '../types';
import { getDashboardStats } from '../fabricInventory';
import StatCard from '../components/StatCard';
import OrderCard from '../components/OrderCard';

interface DashboardPageProps {
  orders: Order[];
  onStatusChange: (order: Order) => void;
}

export default function DashboardPage({ orders, onStatusChange }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    inProductionOrders: 0,
    lowStockFabrics: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('加载统计数据失败');
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div style={loadingStyle}>
        <div style={loadingSpinnerStyle} />
        <div style={loadingTextStyle}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle}>
        <div style={errorTextStyle}>{error}</div>
        <button onClick={loadStats} style={retryButtonStyle}>
          重试
        </button>
      </div>
    );
  }

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
        {orders.length > 0 ? (
          <div style={ordersGridStyle} className="orders-grid">
            {orders.slice(0, 6).map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
            ))}
          </div>
        ) : (
          <div style={emptyStyle}>暂无订单数据</div>
        )}
      </div>
    </div>
  );
}

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
  padding: '60px 20px',
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

const errorStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  gap: '16px',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#E74C3C',
};

const retryButtonStyle: React.CSSProperties = {
  padding: '8px 24px',
  backgroundColor: '#3498DB',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#999999',
  fontSize: '14px',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E0E0E0',
};
