import { useState, useEffect } from 'react';
import { Order, STATUS_LABELS, STATUS_FLOW, RENTAL_PERIOD_LABELS, Plant } from '../types';
import OrderModal from '../components/OrderModal';

interface Props {
  isAdmin: boolean;
}

export default function OrderPage({ isAdmin }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, plantsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/plants'),
      ]);
      const ordersData = await ordersRes.json();
      const plantsData = await plantsRes.json();
      setOrders(ordersData);
      setPlants(plantsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o =>
    filterStatus === 'all' ? true : o.status === filterStatus
  );

  const getStatusClass = (status: Order['status']) => {
    const map: Record<string, string> = {
      pending: 'badge-yellow',
      accepted: 'badge-blue',
      delivering: 'badge-blue',
      renting: 'badge-green',
      returned: 'badge-green',
      completed: '',
    };
    return map[status] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 {isAdmin ? '订单管理' : '我的订单'}</h1>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setSelectedPlant(plants[0] || null)} disabled={plants.length === 0}>
            + 新建订单
          </button>
        )}
      </div>

      <div className="filter-bar">
        {[
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待确认' },
          { value: 'accepted', label: '已接单' },
          { value: 'delivering', label: '配送中' },
          { value: 'renting', label: '租赁中' },
          { value: 'returned', label: '已归还' },
          { value: 'completed', label: '已结束' },
        ].map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filterStatus === f.value ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无订单</p>
          {!isAdmin && (
            <button className="btn btn-primary mt-16" onClick={() => window.location.href = '/plants'}>
              去浏览植物
            </button>
          )}
        </div>
      ) : (
        <div className="order-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-header">
                <div className="order-id">订单号: {order.id.slice(0, 12)}...</div>
                <span className={`badge ${getStatusClass(order.status)}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="order-body">
                <div className="order-plant">
                  <div className="plant-mini-img">{order.plant_name?.charAt(0) || '🌿'}</div>
                  <div>
                    <div className="plant-name-sm">{order.plant_name}</div>
                    <div className="order-period">{RENTAL_PERIOD_LABELS[order.rental_period]}</div>
                  </div>
                </div>

                <div className="order-customer">
                  <div>👤 {order.customer_name}</div>
                  <div>📞 {order.phone}</div>
                  <div>📍 {order.address}</div>
                </div>

                <div className="order-meta">
                  <div className="order-total">¥{order.total_price.toFixed(2)}</div>
                  <div className="order-time">下单: {new Date(order.created_at).toLocaleString()}</div>
                </div>
              </div>

              {isAdmin && STATUS_FLOW[order.status] && (
                <div className="order-footer">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => updateOrderStatus(order.id, STATUS_FLOW[order.status]!)}
                  >
                    标记为「{STATUS_LABELS[STATUS_FLOW[order.status]!]}」
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPlant && (
        <OrderModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onSuccess={() => {
            setSelectedPlant(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
