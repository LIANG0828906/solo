import React, { useEffect, useState } from 'react';
import { Order, useOrders } from '../../context/OrderContext';

interface Props {
  order: Order;
  onCancel: () => void;
  onClose: () => void;
}

const OrderResult: React.FC<Props> = ({ order, onCancel, onClose }) => {
  const { fetchOrders, state } = useOrders();
  const [currentOrder, setCurrentOrder] = useState(order);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    const updated = state.orders.find((o) => o.id === order.id);
    if (updated) setCurrentOrder(updated);
  }, [state.orders, order.id]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '等待确认', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: '⏳' };
      case 'confirmed':
        return { label: '已确认', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', icon: '✅' };
      case 'rejected':
        return { label: '已拒绝', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', icon: '❌' };
      case 'cancelled':
        return { label: '已取消', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)', icon: '🚫' };
      default:
        return { label: status, color: '#6B7280', bg: '#F3F4F6', icon: '📋' };
    }
  };

  const statusConfig = getStatusConfig(currentOrder.status);

  const formatArrival = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '480px',
    animation: 'popIn 0.3s ease-out',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    background: statusConfig.bg,
    padding: '32px 28px',
    textAlign: 'center',
    borderBottom: `1px solid ${statusConfig.color}20`,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '56px',
    marginBottom: '12px',
  };

  const statusLabelStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    color: statusConfig.color,
    marginBottom: '8px',
  };

  const orderNoStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    fontFamily: 'monospace',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '24px 28px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    fontSize: '14px',
    borderBottom: '1px dashed #F3F4F6',
  };

  const infoLabelStyle: React.CSSProperties = {
    color: '#6B7280',
  };

  const infoValueStyle: React.CSSProperties = {
    color: '#1F2937',
    fontWeight: 600,
    textAlign: 'right',
    maxWidth: '60%',
  };

  const itemsListStyle: React.CSSProperties = {
    background: '#FDF2F8',
    borderRadius: '12px',
    padding: '16px',
    border: '0.5px solid #E5E7EB',
  };

  const itemRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
  };

  const totalStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderTop: '2px dashed #E5E7EB',
    marginTop: '10px',
    fontSize: '18px',
    fontWeight: 800,
  };

  const waitTimeBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#F59E0B',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 700,
    marginTop: '12px',
    border: `1px solid #F59E0B30`,
  };

  const footerStyle: React.CSSProperties = {
    padding: '20px 28px',
    borderTop: '0.5px solid #E5E7EB',
    display: 'flex',
    gap: '12px',
  };

  const cancelBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: '1.5px solid #EF4444',
    background: '#FFFFFF',
    color: '#EF4444',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const closeBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#F59E0B',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const canCancel = currentOrder.status === 'pending';

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()} className="animate-pop-in">
        <div style={headerStyle}>
          <div style={iconStyle}>{statusConfig.icon}</div>
          <div style={statusLabelStyle}>{statusConfig.label}</div>
          <div style={orderNoStyle}>订单号：{currentOrder.orderNo}</div>
        </div>

        <div style={bodyStyle}>
          {(currentOrder.status === 'pending' || currentOrder.status === 'confirmed') && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={waitTimeBadgeStyle}>
                ⏱️ 预计等待时间：<strong>{currentOrder.estimatedWaitMinutes}</strong> 分钟
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>顾客信息</div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>姓名</span>
              <span style={infoValueStyle}>{currentOrder.customerName}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>联系方式</span>
              <span style={infoValueStyle}>{currentOrder.phone}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>预计到店</span>
              <span style={infoValueStyle}>{formatArrival(currentOrder.estimatedArrival)}</span>
            </div>
            {currentOrder.notes && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>备注</span>
                <span style={infoValueStyle}>{currentOrder.notes}</span>
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>订单详情</div>
            <div style={itemsListStyle}>
              {currentOrder.items.map((item, idx) => (
                <div key={idx} style={itemRowStyle}>
                  <span style={{ color: '#1F2937' }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ color: '#EF4444', fontWeight: 600 }}>
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={totalStyle}>
                <span style={{ color: '#1F2937' }}>合计</span>
                <span style={{ color: '#EF4444' }}>¥{currentOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          {canCancel && (
            <button
              style={cancelBtnStyle}
              onClick={onCancel}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              }}
            >
              🚫 取消订单
            </button>
          )}
          <button
            style={{ ...closeBtnStyle, flex: canCancel ? 1 : 2 }}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
            }}
          >
            {canCancel ? '关闭' : '知道了'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderResult;
