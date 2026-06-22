import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';
import MenuManagement from './MenuManagement';
import OrderManagement from './OrderManagement';
import StatsPanel from './StatsPanel';
import NewOrderToast from './NewOrderToast';

type TabType = 'orders' | 'menu' | 'stats';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const { fetchOrders, fetchStats, state } = useOrders();
  const pendingCount = state.orders.filter((o) => o.status === 'pending').length;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  const tabs: { key: TabType; label: string; icon: string; count?: number }[] = [
    { key: 'orders', label: '订单管理', icon: '📋', count: pendingCount },
    { key: 'menu', label: '菜单管理', icon: '🍽️' },
    { key: 'stats', label: '销售统计', icon: '📊' },
  ];

  const pageTitleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '24px',
  };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '8px',
    border: '0.5px solid #E5E7EB',
    overflowX: 'auto',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    background: isActive ? '#F59E0B' : 'transparent',
    color: isActive ? '#FFFFFF' : '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    position: 'relative',
  });

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '50%',
    minWidth: '22px',
    height: '22px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
  };

  return (
    <div>
      <h1 style={pageTitleStyle}>⚙️ 管理后台</h1>
      <p style={subtitleStyle}>管理您的菜单、订单和查看销售数据</p>

      <div style={tabsContainerStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={getTabStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7';
                (e.currentTarget as HTMLButtonElement).style.color = '#92400E';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span style={badgeStyle}>{tab.count > 99 ? '99+' : tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && <OrderManagement />}
      {activeTab === 'menu' && <MenuManagement />}
      {activeTab === 'stats' && <StatsPanel />}

      {state.newOrderIds.length > 0 && <NewOrderToast />}
    </div>
  );
};

export default AdminView;
