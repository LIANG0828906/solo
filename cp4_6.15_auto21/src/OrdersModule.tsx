import { useState, useMemo, memo, useCallback } from 'react';
import type { Order, OrderStatus, Promotion } from './types';
import {
  formatCurrency,
  formatDateTime,
  isOrderOverdue,
  getOrderProgress,
  getNextOrderStatus,
  validatePromoCode
} from './utils';

interface OrdersModuleProps {
  orders: Order[];
  promotions: Promotion[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onApplyPromoCode: (orderId: string, promoCode: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  promotions: Promotion[];
  onToggle: (orderId: string) => void;
  onStatusChange: (order: Order) => void;
  onCancel: (order: Order) => void;
  onApplyPromo: (order: Order, code: string) => void;
  promoInput: string;
  onPromoInputChange: (orderId: string, value: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const OrderCard = memo(function OrderCard({
  order,
  isExpanded,
  promotions,
  onToggle,
  onStatusChange,
  onCancel,
  onApplyPromo,
  promoInput,
  onPromoInputChange,
  onShowToast
}: OrderCardProps) {
  const overdue = isOrderOverdue(order);
  const progress = getOrderProgress(order.status);
  const nextStatus = getNextOrderStatus(order.status);

  const handleApplyPromoClick = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      onShowToast('请输入折扣码', 'error');
      return;
    }
    if (order.promoCode) {
      onShowToast('该订单已使用折扣码', 'error');
      return;
    }
    const result = validatePromoCode(code, order.totalAmount, promotions);
    if (!result.valid) {
      onShowToast(result.message, 'error');
      return;
    }
    onApplyPromo(order, code);
  };

  return (
    <div
      className={`order-card ${overdue ? 'overdue' : ''}`}
    >
      <div
        className="order-accordion-header"
        onClick={() => onToggle(order.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div>
            <div className="order-customer">
              {order.customerName}
              {overdue && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  background: '#E74C3C',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '500'
                }}>
                  逾期
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '4px' }}>
              下单时间：{formatDateTime(order.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`order-status status-${order.status}`}>
            {order.status}
          </span>
          <span className={`accordion-icon ${isExpanded ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      <div className={`order-details ${isExpanded ? 'open' : ''}`}>
        <div className="order-progress-bar">
          <div
            className="order-progress-fill"
            style={{
              width: order.status === '已取消' ? '0%' : `${progress}%`,
              background: order.status === '已取消' ? '#95A5A6' : undefined
            }}
          />
        </div>

        <div className="order-items">
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#2C3E50' }}>
            商品清单：
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item">
              <span>{item.bookTitle} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {order.promoCode && (
          <div style={{ fontSize: '13px', color: '#27AE60', marginBottom: '8px' }}>
            已使用折扣码：<strong>{order.promoCode}</strong>，优惠 {formatCurrency(order.discountAmount)}
          </div>
        )}

        {order.status === '待支付' && !order.promoCode && (
          <div className="promo-apply-section">
            <input
              type="text"
              className="form-input"
              placeholder="输入折扣码"
              value={promoInput}
              onChange={(e) => onPromoInputChange(order.id, e.target.value)}
              style={{ flex: 1, minWidth: '140px' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyPromoClick();
              }}
            >
              应用折扣
            </button>
          </div>
        )}

        <div className="order-footer">
          <div>
            {order.discountAmount > 0 && (
              <div style={{ fontSize: '12px', color: '#7F8C8D', textDecoration: 'line-through' }}>
                原价：{formatCurrency(order.totalAmount)}
              </div>
            )}
            <div className="order-amount">
              {order.discountAmount > 0 ? '实付：' : ''}{formatCurrency(order.finalAmount)}
            </div>
          </div>
          <div className="order-actions" onClick={(e) => e.stopPropagation()}>
            {nextStatus && (
              <button className="btn btn-sm" onClick={() => onStatusChange(order)}>
                {nextStatus}
              </button>
            )}
            {(order.status === '待支付' || order.status === '已支付') && (
              <button className="btn btn-danger btn-sm" onClick={() => onCancel(order)}>
                取消订单
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.order === nextProps.order &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.promoInput === nextProps.promoInput &&
    prevProps.promotions === nextProps.promotions
  );
});

const OrdersModule = ({
  orders,
  promotions,
  onUpdateOrderStatus,
  onApplyPromoCode,
  onShowToast
}: OrdersModuleProps) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [promoInputs, setPromoInputs] = useState<Record<string, string>>({});

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aOverdue = isOrderOverdue(a);
      const bOverdue = isOrderOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [orders]);

  const toggleAccordion = useCallback((orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleStatusChange = useCallback((order: Order) => {
    const nextStatus = getNextOrderStatus(order.status);
    if (nextStatus) {
      onUpdateOrderStatus(order.id, nextStatus);
      onShowToast(`订单状态已更新为「${nextStatus}」`, 'success');
    }
  }, [onUpdateOrderStatus, onShowToast]);

  const handleCancelOrder = useCallback((order: Order) => {
    if (order.status === '已完成' || order.status === '已取消') return;
    onUpdateOrderStatus(order.id, '已取消');
    onShowToast('订单已取消', 'info');
  }, [onUpdateOrderStatus, onShowToast]);

  const handleApplyPromo = useCallback((order: Order, code: string) => {
    onApplyPromoCode(order.id, code);
    setPromoInputs(prev => ({ ...prev, [order.id]: '' }));
  }, [onApplyPromoCode]);

  const handlePromoInputChange = useCallback((orderId: string, value: string) => {
    setPromoInputs(prev => ({ ...prev, [orderId]: value }));
  }, []);

  return (
    <div className="module">
      <div className="section-header">
        <h2 className="section-title">订单管理（共 {orders.length} 单）</h2>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">暂无订单</div>
        </div>
      ) : (
        <div className="orders-list">
          {sortedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrders.has(order.id)}
              promotions={promotions}
              onToggle={toggleAccordion}
              onStatusChange={handleStatusChange}
              onCancel={handleCancelOrder}
              onApplyPromo={handleApplyPromo}
              promoInput={promoInputs[order.id] || ''}
              onPromoInputChange={handlePromoInputChange}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersModule;
