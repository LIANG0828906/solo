import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Order } from '../../types';

const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('更新订单状态失败:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待确认';
      case 'paid': return '已付款';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container orders-container">
      <h1 className="page-title">订单管理</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          暂无订单记录
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <img
                src={order.imageUrl}
                alt={order.title}
                className="order-thumbnail"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.background = '#E0E0D0';
                  (e.target as HTMLImageElement).src = '';
                }}
              />
              <div className="order-info">
                <div className="order-title">{order.title}</div>
                <div className="order-buyer">
                  买家：{order.buyerName || '匿名'} {order.buyerEmail ? `(${order.buyerEmail})` : ''}
                </div>
                <div className="order-price">¥{order.price?.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`order-status ${order.status}`}>
                  {getStatusLabel(order.status)}
                </span>
                <div className="order-date" style={{ marginTop: '8px' }}>
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => updateStatus(order.id, 'paid')}
                  >
                    确认付款
                  </button>
                )}
                {order.status === 'paid' && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => updateStatus(order.id, 'completed')}
                  >
                    完成订单
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderPage;
