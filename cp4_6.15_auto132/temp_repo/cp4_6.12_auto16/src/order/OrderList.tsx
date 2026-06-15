import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, Order } from '../api';

const STATUS_LABELS = [
  '材料准备',
  '木工成型',
  '打磨',
  '上漆',
  '装配',
  '调音',
  '最终检查',
  '完成',
];

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h2 className="page-title">订单管理</h2>
      <p className="page-subtitle">查看和管理所有定制乐器订单</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>暂无订单</h3>
          <p>还没有客户提交定制订单</p>
        </div>
      ) : (
        <div className="order-list">
          <table className="order-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>乐器型号</th>
                <th>客户姓名</th>
                <th>当前进度</th>
                <th>下单时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td>#{order.id.toString().padStart(4, '0')}</td>
                  <td>{order.instrumentName}</td>
                  <td>{order.customerName}</td>
                  <td>
                    <span className={`order-status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderList;
