import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import type { Order } from '@/types';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { orders, fetchOrders, user } = useStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders(user.id).finally(() => setLoading(false));
    }
  }, [user, fetchOrders]);

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipping: '配送中',
      delivered: '已签收',
    };
    return statusMap[status];
  };

  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      pending: 'overdue',
      paid: 'returned',
      shipping: 'returned',
      delivered: 'borrowed',
    };
    return colorMap[status];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <i className="fas fa-user-lock" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-text)' }}>请先登录</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>登录后查看您的订单</p>
          <button className="btn btn-primary" onClick={() => navigate('/login', { state: { from: '/orders' } })}>
            去登录
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="timeline">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="timeline-item">
              <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: 'var(--radius-md)' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">我的订单</h1>
          <p className="page-subtitle">查看所有订单记录</p>
        </div>
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <i className="fas fa-box-open" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-text)' }}>暂无订单</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>快去挑选心仪的图书吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            去逛逛
          </button>
        </div>
      </div>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">我的订单</h1>
        <p className="page-subtitle">查看所有订单记录</p>
      </div>

      <div className="timeline">
        {sortedOrders.map((order, index) => (
          <div key={order.id} className="timeline-item">
            <div 
              className={`card order-card ${expandedOrder === order.id ? 'expanded' : ''}`}
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="order-header">
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                    {formatDate(order.createdAt)}
                  </p>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                    订单号：{order.id.slice(0, 8)}...
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                    共 {order.items.length} 件商品
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${getStatusColor(order.status)}`} style={{ marginBottom: '8px' }}>
                    {getStatusText(order.status)}
                  </span>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    ¥{order.totalAmount.toFixed(2)}
                  </p>
                  <i 
                    className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`} 
                    style={{ color: 'var(--color-text-light)', fontSize: '12px' }}
                  ></i>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ paddingTop: '16px' }}>
                    {order.items.map((item) => (
                      <div 
                        key={item.bookId} 
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          padding: '12px 0',
                          alignItems: 'center',
                        }}
                      >
                        <img 
                          src={item.book.coverUrl} 
                          alt={item.book.title} 
                          style={{ width: '50px', height: '66px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                            {item.book.title}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                            {item.book.author}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                            ¥{(item.book.price * item.quantity).toFixed(2)}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                            x{item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                        配送至：{order.shippingAddress.name} {order.shippingAddress.phone}
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
                        {order.shippingAddress.address}
                      </p>
                    </div>
                    <button 
                      className="btn btn-outline" 
                      style={{ alignSelf: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order.id}`);
                      }}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
