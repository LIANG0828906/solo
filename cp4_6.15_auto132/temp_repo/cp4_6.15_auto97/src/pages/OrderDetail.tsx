import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrder, updateOrderStatus } from '@/api';
import type { Order } from '@/types';
import OrderSteps from '@/components/OrderSteps';
import { useStore } from '@/store';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    if (id) {
      loadOrder();
      const interval = setInterval(loadOrder, 2000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadOrder = async () => {
    const response = await fetchOrder(id!);
    if (response.success && response.data) {
      setOrder(response.data);
    }
    setLoading(false);
  };

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipping: '配送中',
      delivered: '已签收',
    };
    return statusMap[status];
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '100%', height: '100px', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>订单不存在</p>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        className="btn btn-outline" 
        style={{ marginBottom: '24px' }}
        onClick={() => navigate('/orders')}
      >
        <i className="fas fa-arrow-left"></i> 返回订单列表
      </button>

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '4px', color: 'var(--color-text)' }}>
              订单详情
            </h1>
            <p style={{ color: 'var(--color-text-light)' }}>
              订单号：{order.id}
            </p>
          </div>
          <span className={`status-badge ${order.status === 'delivered' ? 'borrowed' : order.status === 'pending' ? 'overdue' : 'returned'}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        <OrderSteps status={order.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text)' }}>
            商品清单
          </h2>
          {order.items.map((item) => (
            <div 
              key={item.bookId} 
              style={{ 
                display: 'flex', 
                gap: '16px', 
                padding: '16px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <img 
                src={item.book.coverUrl} 
                alt={item.book.title} 
                style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text)' }}>
                  {item.book.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                  {item.book.author}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-light)' }}>数量：{item.quantity}</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    ¥{(item.book.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--color-text)' }}>
              配送信息
            </h3>
            <p style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-light)' }}>收货人：</span>
              {order.shippingAddress.name}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-light)' }}>电话：</span>
              {order.shippingAddress.phone}
            </p>
            <p>
              <span style={{ color: 'var(--color-text-light)' }}>地址：</span>
              {order.shippingAddress.address}
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--color-text)' }}>
              支付信息
            </h3>
            <p style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-light)' }}>支付方式：</span>
              {order.paymentMethod === 'wechat' ? '微信支付' : '支付宝'}
            </p>
            <div style={{ 
              borderTop: '1px solid var(--color-border)', 
              paddingTop: '16px', 
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>订单总额</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>
                ¥{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {user?.role === 'admin' && order.status !== 'delivered' && (
            <button 
              className="btn btn-accent" 
              style={{ width: '100%', marginTop: '16px' }}
              onClick={async () => {
                const statuses: Order['status'][] = ['pending', 'paid', 'shipping', 'delivered'];
                const nextIndex = Math.min(statuses.indexOf(order.status) + 1, 3);
                await updateOrderStatus(order.id, statuses[nextIndex]);
                loadOrder();
              }}
            >
              更新状态
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
