import { useState, useMemo } from 'react';
import type { Order, OrderStatus } from '@shared/types';
import { updateOrderStatus, createOrder } from '../services/api';
import type { CartItem } from '@shared/types';

interface OrderPanelProps {
  orders: Order[];
  onRefresh: () => void;
  isCustomerView?: boolean;
  cartItems?: CartItem[];
  onOrderSubmitted?: () => void;
}

const PAGE_SIZE = 20;

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#E65100', bg: '#FFF3E0' },
  confirmed: { label: '已确认', color: '#1565C0', bg: '#E3F2FD' },
  shipped: { label: '已发货', color: '#6A1B9A', bg: '#F3E5F5' },
  completed: { label: '已完成', color: '#2E7D32', bg: '#E8F5E9' },
  cancelled: { label: '已取消', color: '#757575', bg: '#F5F5F5' },
};

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

const emptyForm: OrderFormData = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
};

export function OrderPanel({
  orders,
  onRefresh,
  isCustomerView = false,
  cartItems = [],
  onOrderSubmitted,
}: OrderPanelProps) {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(emptyForm);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = sortedOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      onRefresh();
    } catch (err) {
      console.error('Update order status failed:', err);
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('购物车为空');
      return;
    }
    try {
      await createOrder({
        items: cartItems.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        ...formData,
      });
      setFormData(emptyForm);
      setShowForm(false);
      onOrderSubmitted?.();
      onRefresh();
    } catch (err) {
      console.error('Create order failed:', err);
    }
  };

  const renderActions = (order: Order) => {
    if (isCustomerView) return null;
    const actions: { status: OrderStatus; label: string }[] = [];

    if (order.status === 'pending') {
      actions.push({ status: 'confirmed', label: '确认' });
      actions.push({ status: 'cancelled', label: '取消' });
    }
    if (order.status === 'confirmed') {
      actions.push({ status: 'shipped', label: '发货' });
      actions.push({ status: 'cancelled', label: '取消' });
    }
    if (order.status === 'shipped') {
      actions.push({ status: 'completed', label: '完成' });
    }

    return (
      <div style={styles.actions}>
        {actions.map((a) => (
          <button
            key={a.status}
            style={
              a.status === 'cancelled'
                ? styles.dangerBtn
                : a.status === 'completed'
                ? styles.primaryBtn
                : styles.secondaryBtn
            }
            onClick={() => handleStatusUpdate(order.id, a.status)}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{isCustomerView ? '我的订单' : '订单管理'}</h2>
        {isCustomerView && cartItems.length > 0 && (
          <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
            {showForm ? '收起' : '提交订单'}
          </button>
        )}
      </div>

      {showForm && isCustomerView && (
        <form style={styles.form} onSubmit={handleSubmitOrder}>
          <h3 style={styles.formTitle}>提交订单 (共 {cartItems.length} 种商品，¥{cartTotal.toFixed(2)})</h3>
          <div style={styles.formGrid}>
            <input
              style={styles.input}
              placeholder="联系人姓名"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="手机号"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              required
              pattern="[0-9]{11}"
              title="请输入11位手机号"
            />
            <input
              style={{ ...styles.input, gridColumn: '1 / -1' }}
              placeholder="收货地址"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              required
            />
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.primaryBtn}>
              确认下单
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowForm(false)}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {pageOrders.length === 0 ? (
        <div style={styles.empty}>暂无订单</div>
      ) : (
        <>
          <div style={styles.list}>
            {pageOrders.map((order) => {
              const cfg = statusConfig[order.status];
              return (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <div style={styles.orderMeta}>
                      <span style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div style={styles.customerInfo}>
                    <div>
                      <span style={styles.label}>联系人：</span>
                      <span style={styles.value}>{order.customerName}</span>
                    </div>
                    <div>
                      <span style={styles.label}>电话：</span>
                      <span style={styles.value}>{order.customerPhone}</span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={styles.label}>地址：</span>
                      <span style={styles.value}>{order.customerAddress}</span>
                    </div>
                  </div>

                  <div style={styles.itemsList}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={styles.itemRow}>
                        <span style={styles.itemTitle}>{item.title}</span>
                        <span style={styles.itemQty}>×{item.quantity}</span>
                        <span style={styles.itemPrice}>¥{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.orderFooter}>
                    <span style={styles.totalLabel}>合计：</span>
                    <span style={styles.totalAmount}>¥{order.totalAmount.toFixed(2)}</span>
                    {renderActions(order)}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span style={styles.pageInfo}>
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                style={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  } as React.CSSProperties,
  title: {
    fontSize: 22,
    color: '#5D4037',
    fontWeight: 600,
  } as React.CSSProperties,
  primaryBtn: {
    padding: '8px 18px',
    backgroundColor: '#D84315',
    color: '#FFF8E1',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  } as React.CSSProperties,
  secondaryBtn: {
    padding: '6px 14px',
    backgroundColor: '#FFE0B2',
    color: '#5D4037',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  dangerBtn: {
    padding: '6px 14px',
    backgroundColor: '#FFCCBC',
    color: '#BF360C',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  form: {
    backgroundColor: '#FFFBF5',
    border: '1px solid #FFE0B2',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  } as React.CSSProperties,
  formTitle: {
    fontSize: 16,
    color: '#5D4037',
    marginBottom: 16,
    fontWeight: 600,
  } as React.CSSProperties,
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 16,
  } as React.CSSProperties,
  input: {
    padding: '9px 12px',
    border: '1px solid #FFCC80',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#FFFDF8',
    color: '#3E2723',
    outline: 'none',
  } as React.CSSProperties,
  formActions: {
    display: 'flex',
    gap: 10,
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  } as React.CSSProperties,
  orderCard: {
    backgroundColor: '#FFFDF8',
    border: '1px solid #FFE0B2',
    borderRadius: 10,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as React.CSSProperties,
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  } as React.CSSProperties,
  orderMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  orderId: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 600,
    color: '#5D4037',
  } as React.CSSProperties,
  orderDate: {
    fontSize: 13,
    color: '#8D6E63',
  } as React.CSSProperties,
  statusBadge: {
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  customerInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFBF5',
    borderRadius: 6,
    fontSize: 13,
  } as React.CSSProperties,
  label: {
    color: '#8D6E63',
  } as React.CSSProperties,
  value: {
    color: '#3E2723',
  } as React.CSSProperties,
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '4px 0',
  } as React.CSSProperties,
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
  } as React.CSSProperties,
  itemTitle: {
    flex: 1,
    color: '#3E2723',
  } as React.CSSProperties,
  itemQty: {
    color: '#8D6E63',
    minWidth: 40,
    textAlign: 'right' as const,
  } as React.CSSProperties,
  itemPrice: {
    color: '#D84315',
    fontWeight: 500,
    minWidth: 80,
    textAlign: 'right' as const,
  } as React.CSSProperties,
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #FFE0B2',
    flexWrap: 'wrap',
    gap: 10,
  } as React.CSSProperties,
  totalLabel: {
    fontSize: 14,
    color: '#5D4037',
  } as React.CSSProperties,
  totalAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: '#D84315',
    flex: 1,
    marginLeft: 6,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  } as React.CSSProperties,
  pageBtn: {
    padding: '6px 16px',
    backgroundColor: '#FFE0B2',
    color: '#5D4037',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  } as React.CSSProperties,
  pageInfo: {
    fontSize: 14,
    color: '#8D6E63',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#A1887F',
    fontSize: 16,
  } as React.CSSProperties,
};
