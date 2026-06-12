import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, Order, STATUS_FLOW } from '../api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      console.error('更新订单状态失败:', err);
      alert('更新失败，请稍后重试');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    const index = STATUS_FLOW.indexOf(status);
    if (index === STATUS_FLOW.length - 1) return '#4CAF50';
    if (index >= 0) return '#FF9800';
    return '#999';
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.currentStatus === filter);

  if (loading) {
    return <div className="orders-page"><p>加载中...</p></div>;
  }

  return (
    <div className="orders-page">
      <h1 className="page-title">订单管理</h1>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部 ({orders.length})
        </button>
        {STATUS_FLOW.map((status) => {
          const count = orders.filter((o) => o.currentStatus === status).length;
          return (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state card">
            <p>暂无订单</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.currentStatus);
            return (
              <div key={order.id} className="order-card card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">#{order.id}</span>
                    <span className="order-customer">{order.customerName}</span>
                    {order.customerEmail && (
                      <span className="order-email">{order.customerEmail}</span>
                    )}
                  </div>
                  <span
                    className="order-status"
                    style={{
                      backgroundColor: `${getStatusColor(order.currentStatus)}20`,
                      color: getStatusColor(order.currentStatus),
                    }}
                  >
                    {order.currentStatus}
                  </span>
                </div>

                <div className="order-body">
                  <div className="order-stats">
                    <div className="stat-item">
                      <span className="stat-label">瓷砖数量</span>
                      <span className="stat-value">{order.totalTiles} 块</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">材料种类</span>
                      <span className="stat-value">
                        {new Set(order.tiles.map((t) => `${t.shape}-${t.color}`)).size} 种
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">创建时间</span>
                      <span className="stat-value">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>

                  <div className="order-progress">
                    {STATUS_FLOW.slice(0, 5).map((status, index) => {
                      const currentIdx = STATUS_FLOW.indexOf(order.currentStatus);
                      const isCompleted = index <= currentIdx;
                      const isCurrent = status === order.currentStatus;
                      return (
                        <div
                          key={status}
                          className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                          title={status}
                        >
                          <div className="step-dot" />
                        </div>
                      );
                    })}
                    <div className="progress-more" title="更多步骤">
                      ...
                    </div>
                  </div>
                </div>

                <div className="order-actions">
                  <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-small">
                    查看详情
                  </Link>
                  {nextStatus && (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleUpdateStatus(order.id, nextStatus)}
                    >
                      更新为: {nextStatus}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
