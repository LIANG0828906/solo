import { useState, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import OrderCard from '../components/OrderCard';
import type { Order } from '../types';
import './HistoryPage.css';

export default function HistoryPage() {
  const { orders, setOrders } = useOrderStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'archived'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/orders');
      const data = await response.json();
      setOrders(data.filter((o: any) => o.status !== 'active'));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setOrders(mockHistory);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return order.status === 'completed' || order.status === 'archived';
    return order.status === filter;
  });

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>历史记录</h1>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          已完成
        </button>
        <button
          className={`filter-tab ${filter === 'archived' ? 'active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          已归档
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-history">
          <p className="empty-icon">📋</p>
          <p>暂无历史记录</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

const mockHistory: Order[] = [
  {
    id: 'h1',
    title: '618淘宝凑单 满300减50',
    type: 'shopping',
    totalAmount: 320,
    targetMembers: 4,
    currentMembers: 4,
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-1',
    creatorName: '小明',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
    members: [],
    status: 'completed',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'h2',
    title: '上周拼车去机场',
    type: 'carpool',
    totalAmount: 100,
    targetMembers: 4,
    currentMembers: 4,
    deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-2',
    creatorName: '小红',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong',
    members: [],
    status: 'archived',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'h3',
    title: '奶茶拼单 第二杯半价',
    type: 'food',
    totalAmount: 28,
    targetMembers: 2,
    currentMembers: 2,
    deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-3',
    creatorName: '奶茶控',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=naichakong',
    members: [],
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
