import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { orderApi } from '../api';
import {
  Order,
  OrderStatus,
  STATUS_NAMES,
  STATUS_COLORS,
  SIZE_NAMES
} from '../types';

interface AdminPageProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function AdminPage({ showToast }: AdminPageProps) {
  const { orders, setOrders, updateOrderStatus, setLoading } = useAppStore();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderApi.getAll();
        setOrders(data);
      } catch (err) {
        console.error('加载订单失败:', err);
        showToast('加载订单失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [setOrders, setLoading, showToast]);

  const handleStatusChange = useCallback(async (orderId: string, status: OrderStatus) => {
    setLoading(true);
    try {
      const updated = await orderApi.updateStatus(orderId, status);
      if (updated) {
        updateOrderStatus(orderId, status);
        showToast(`订单状态已更新为「${STATUS_NAMES[status]}」`);
      }
    } catch (err) {
      console.error('更新状态失败:', err);
      showToast('更新状态失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [updateOrderStatus, setLoading, showToast]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    printing: orders.filter(o => o.status === 'printing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0)
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 订单管理</h1>
        <p className="page-subtitle">
          管理所有冲印订单，跟踪打印进度和订单状态
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '2px solid #E0D6C8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 13, color: '#8D6E63', marginBottom: 8 }}>待处理</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#F1C40F' }}>{stats.pending}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '2px solid #E0D6C8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 13, color: '#8D6E63', marginBottom: 8 }}>冲印中</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3498DB' }}>{stats.printing}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '2px solid #E0D6C8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 13, color: '#8D6E63', marginBottom: 8 }}>已完成</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2ECC71' }}>{stats.completed}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '2px solid #E0D6C8',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 13, color: '#8D6E63', marginBottom: 8 }}>已完成营收</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#D35400' }}>¥{stats.revenue.toFixed(2)}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">暂无订单数据</div>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order: Order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <div className="order-card-id">
                    订单号：{order.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="order-card-customer">
                    {order.customerName} · {order.customerPhone}
                  </div>
                  <div className="order-card-customer">
                    下单时间：{formatDate(order.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className="status-tag"
                    style={{ backgroundColor: STATUS_COLORS[order.status] }}
                  >
                    {STATUS_NAMES[order.status]}
                  </span>
                  <select
                    className="status-select"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  >
                    <option value="pending">待处理</option>
                    <option value="printing">冲印中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>

              <div className="order-card-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-card-item">
                    <img
                      src={item.photoUrl}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        objectFit: 'cover'
                      }}
                    />
                    <span>
                      {SIZE_NAMES[item.size]} × {item.quantity}
                      {' '}
                      <span style={{ color: '#D35400', fontWeight: 600 }}>
                        ¥{item.subtotal.toFixed(2)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <span style={{ fontSize: 13, color: '#8D6E63' }}>
                  共 {order.items.length} 种，{order.items.reduce((s, i) => s + i.quantity, 0)} 张
                </span>
                <span className="order-card-price">¥{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
