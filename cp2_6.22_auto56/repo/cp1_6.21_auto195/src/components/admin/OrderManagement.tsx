import React, { useState } from 'react';
import { useOrders, Order } from '../../context/OrderContext';

const OrderManagement: React.FC = () => {
  const { state, confirmOrder, rejectOrder, markOrderSeen } = useOrders();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filteredOrders =
    filter === 'all'
      ? state.orders
      : state.orders.filter((o) => o.status === filter);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待确认',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '#FCD34D',
          icon: '⏳',
        };
      case 'confirmed':
        return {
          label: '已确认',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '#6EE7B7',
          icon: '✅',
        };
      case 'rejected':
        return {
          label: '已拒绝',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: '#FCA5A5',
          icon: '❌',
        };
      case 'cancelled':
        return {
          label: '已取消',
          color: '#6B7280',
          bg: 'rgba(107, 114, 128, 0.12)',
          border: '#D1D5DB',
          icon: '🚫',
        };
      default:
        return { label: status, color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', icon: '📋' };
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(iso)}`;
  };

  const handleConfirm = async (order: Order) => {
    try {
      setActionLoading(order.id);
      setError('');
      await confirmOrder(order.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      setError('');
      await rejectOrder(orderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filterButtons = [
    { key: 'all', label: '全部', count: state.orders.length },
    { key: 'pending', label: '待确认', count: state.orders.filter((o) => o.status === 'pending').length },
    { key: 'confirmed', label: '已确认', count: state.orders.filter((o) => o.status === 'confirmed').length },
    { key: 'rejected', label: '已拒绝', count: state.orders.filter((o) => o.status === 'rejected').length },
    { key: 'cancelled', label: '已取消', count: state.orders.filter((o) => o.status === 'cancelled').length },
  ] as const;

  const pageHeaderStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '4px',
  };

  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
  };

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    background: '#FFFFFF',
    borderRadius: '14px',
    padding: '8px',
    border: '0.5px solid #E5E7EB',
    overflowX: 'auto',
  };

  const getFilterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    background: active ? '#1E293B' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  });

  const filterBadgeStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
    color: active ? '#FFFFFF' : '#6B7280',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 700,
  });

  const errorStyle: React.CSSProperties = {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '0.5px solid #FECACA',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 24px',
    color: '#6B7280',
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '0.5px solid #E5E7EB',
  };

  const ordersListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const orderCardStyle = (isNew: boolean, isExpanded: boolean): React.CSSProperties => ({
    background: isNew
      ? 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)'
      : '#FFFFFF',
    borderRadius: '16px',
    border: `0.5px solid ${isNew ? '#FCA5A5' : '#E5E7EB'}`,
    overflow: 'hidden',
    transition: 'all 0.25s ease',
    boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
  });

  const orderHeaderStyle: React.CSSProperties = {
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    justifyContent: 'space-between',
  };

  const orderMainInfo: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const orderTopRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  };

  const orderNoStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 800,
    fontFamily: 'monospace',
    color: '#1F2937',
  };

  const newBadgeStyle: React.CSSProperties = {
    background: '#EF4444',
    color: '#FFFFFF',
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    animation: 'popIn 0.3s ease-out',
  };

  const statusBadgeStyle = (config: any): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    background: config.bg,
    color: config.color,
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    border: `1px solid ${config.border}`,
  });

  const customerRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 20px',
    fontSize: '13px',
    color: '#4B5563',
    marginBottom: '6px',
  };

  const infoTagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };

  const totalStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    color: '#EF4444',
    whiteSpace: 'nowrap',
  };

  const expandIconStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#9CA3AF',
    transition: 'transform 0.25s ease',
    alignSelf: 'center',
  };

  const expandedSectionStyle: React.CSSProperties = {
    padding: '0 20px 20px',
    borderTop: '1px dashed #E5E7EB',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '16px 0 10px',
  };

  const itemsGridStyle: React.CSSProperties = {
    background: '#FDF2F8',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '0.5px solid #E5E7EB',
  };

  const itemRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    borderBottom: '1px dashed #FECDD3',
  };

  const actionsBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  };

  const confirmBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#10B981',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const rejectBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '1.5px solid #EF4444',
    background: '#FFFFFF',
    color: '#EF4444',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const waitTimeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#F59E0B',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
  };

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h2 style={headerTitleStyle}>📋 订单管理</h2>
        <p style={headerSubtitleStyle}>
          共 {state.orders.length} 条订单 · 点击卡片查看详情并处理
        </p>
      </div>

      <div style={filterBarStyle}>
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            style={getFilterBtnStyle(filter === btn.key)}
            onClick={() => setFilter(btn.key)}
            onMouseEnter={(e) => {
              if (filter !== btn.key) {
                (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== btn.key) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            <span>{btn.label}</span>
            <span style={filterBadgeStyle(filter === btn.key)}>{btn.count}</span>
          </button>
        ))}
      </div>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      {filteredOrders.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            暂无订单
          </div>
          <div style={{ fontSize: '14px' }}>等待顾客提交预订订单...</div>
        </div>
      ) : (
        <div style={ordersListStyle}>
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const isNew = state.newOrderIds.includes(order.id);
            const isExpanded = expandedId === order.id;

            if (isNew) {
              setTimeout(() => markOrderSeen(order.id), 2000);
            }

            return (
              <div
                key={order.id}
                style={orderCardStyle(isNew, isExpanded)}
                className={isNew ? 'animate-slide-in-right' : ''}
              >
                <div
                  style={orderHeaderStyle}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div style={orderMainInfo}>
                    <div style={orderTopRow}>
                      <span style={orderNoStyle}>#{order.orderNo}</span>
                      {isNew && <span style={newBadgeStyle}>NEW</span>}
                      <span style={statusBadgeStyle(statusConfig)}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>

                    <div style={customerRowStyle}>
                      <span style={infoTagStyle}>👤 {order.customerName}</span>
                      <span style={infoTagStyle}>📱 {order.phone}</span>
                      <span style={infoTagStyle}>🕒 {formatDate(order.createdAt)}</span>
                    </div>

                    <div style={customerRowStyle}>
                      <span style={infoTagStyle}>
                        ⏰ 到店：{formatTime(order.estimatedArrival)}
                      </span>
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <span style={waitTimeStyle}>
                          ⏱️ 约等 {order.estimatedWaitMinutes} 分钟
                        </span>
                      )}
                    </div>

                    {order.notes && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginTop: '6px',
                          padding: '6px 10px',
                          background: '#FEF9C3',
                          borderRadius: '8px',
                          borderLeft: '3px solid #F59E0B',
                        }}
                      >
                        💬 {order.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={totalStyle}>¥{order.totalAmount.toFixed(2)}</div>
                    <div
                      style={{
                        ...expandIconStyle,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    >
                      ▼
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={expandedSectionStyle}>
                    <div style={sectionTitleStyle}>🍽️ 订单菜品</div>
                    <div style={itemsGridStyle}>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...itemRowStyle,
                            borderBottom:
                              idx === order.items.length - 1 ? 'none' : '1px dashed #FECDD3',
                          }}
                        >
                          <span style={{ color: '#1F2937' }}>
                            {item.name} <span style={{ color: '#9CA3AF' }}>× {item.quantity}</span>
                          </span>
                          <span style={{ color: '#EF4444', fontWeight: 600 }}>
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0 0',
                          marginTop: '4px',
                          borderTop: '2px dashed #E5E7EB',
                          fontSize: '16px',
                          fontWeight: 800,
                        }}
                      >
                        <span style={{ color: '#1F2937' }}>订单合计</span>
                        <span style={{ color: '#EF4444' }}>¥{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div style={actionsBarStyle}>
                        <button
                          style={confirmBtnStyle}
                          disabled={actionLoading === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(order);
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== order.id) {
                              (e.currentTarget as HTMLButtonElement).style.background = '#059669';
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#10B981';
                          }}
                        >
                          <span>{actionLoading === order.id ? '⏳' : '✅'}</span>
                          <span>{actionLoading === order.id ? '处理中...' : '确认订单'}</span>
                        </button>
                        <button
                          style={rejectBtnStyle}
                          disabled={actionLoading === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(order.id);
                          }}
                          onMouseEnter={(e) => {
                            if (actionLoading !== order.id) {
                              (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                          }}
                        >
                          <span>❌</span>
                          <span>拒绝订单</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
