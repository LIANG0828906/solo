import React, { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { getOrders } from '../api/orderApi';
import type { Order } from '../types';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { showToast, loadOrders } = useStore();

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'shipped', label: '已发货' },
    { value: 'delivered', label: '已送达' },
    { value: 'cancelled', label: '已取消' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(statusFilter === 'all' ? undefined : statusFilter);
      setOrders(data);
      loadOrders(data);
    } catch (error) {
      showToast('获取订单列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#f59e0b',
      processing: '#4f46e5',
      shipped: '#0ea5e9',
      delivered: '#10b981',
      cancelled: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消',
    };
    return textMap[status] || status;
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 24px 0' }}>
        我的订单
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: statusFilter === option.value ? '#4f46e5' : '#f3f4f6',
              color: statusFilter === option.value ? '#ffffff' : '#4b5563',
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== option.value) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== option.value) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无订单</div>
          <div style={{ color: '#6b7280' }}>快去选购心仪的商品吧~</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#1f2937',
                    }}
                  >
                    订单号：{order.id}
                  </span>
                  <span
                    style={{
                      marginLeft: '16px',
                      fontSize: '13px',
                      color: '#6b7280',
                    }}
                  >
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#ffffff',
                    backgroundColor: getStatusColor(order.status),
                  }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  商品清单：
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                        }}
                      />
                      <span>{item.product.name}</span>
                      <span style={{ color: '#6b7280' }}>×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  收货地址：{order.address}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  下单用户：{order.user}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#4f46e5',
                  }}
                >
                  ¥{order.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
