import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

type OrderStatus = 'received' | 'cooking' | 'completed';

interface OrderItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  seatId: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  received: { label: '已接收', color: '#F39C12' },
  cooking: { label: '烹饪中', color: '#3498DB' },
  completed: { label: '已完成', color: '#2ECC71' }
};

function TrackingView() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<OrderStatus | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId.trim()) return;

    try {
      const response = await axios.get(`/api/orders/${orderId.trim()}`);
      const orderData = response.data;
      setOrder(orderData);
      setError(null);
      setIsTracking(true);

      if (lastStatusRef.current !== orderData.status) {
        setStatusKey((prev) => prev + 1);
        lastStatusRef.current = orderData.status;
      }

      if (orderData.status === 'completed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      setError('订单不存在，请检查订单号');
      setOrder(null);
      setIsTracking(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [orderId]);

  const handleSearch = () => {
    if (!orderId.trim()) {
      setError('请输入订单号');
      return;
    }
    lastStatusRef.current = null;
    fetchOrder();
  };

  useEffect(() => {
    if (isTracking && order && order.status !== 'completed') {
      pollIntervalRef.current = setInterval(() => {
        fetchOrder();
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isTracking, order?.status, fetchOrder]);

  const formatPrice = (price: number): string => {
    return `¥${price.toFixed(0)}`;
  };

  const getTotalPrice = (): number => {
    if (!order) return 0;
    return order.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getStatusSteps = () => {
    const steps: OrderStatus[] = ['received', 'cooking', 'completed'];
    return steps;
  };

  const getCurrentStepIndex = (): number => {
    if (!order) return -1;
    const steps = getStatusSteps();
    return steps.indexOf(order.status);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>订单追踪</h2>
      <p style={styles.subtitle}>输入订单号实时查询订单状态</p>

      <div style={styles.searchSection}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="请输入订单号"
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button style={styles.searchButton} onClick={handleSearch}>
          查询
        </button>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {order && (
        <div style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <span style={styles.orderIdLabel}>订单号</span>
            <span style={styles.orderId}>{order.id}</span>
          </div>

          <div style={styles.seatInfo}>
            <span style={styles.seatLabel}>座位号：</span>
            <span style={styles.seatValue}>{order.seatId} 号桌</span>
          </div>

          <div style={styles.statusSection}>
            <div style={styles.statusLabel}>订单状态</div>
            <div
              key={statusKey}
              className="slide-in"
              style={{
                ...styles.statusBadge,
                backgroundColor: statusConfig[order.status].color
              }}
            >
              {statusConfig[order.status].label}
            </div>
          </div>

          <div style={styles.progressSection}>
            {getStatusSteps().map((step, index) => {
              const isActive = index <= getCurrentStepIndex();
              const isCurrent = index === getCurrentStepIndex();
              return (
                <div key={step} style={styles.stepItem}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      backgroundColor: isActive
                        ? statusConfig[step].color
                        : '#BDC3C7',
                      ...(isCurrent ? styles.stepCircleCurrent : {})
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      ...styles.stepLabel,
                      color: isActive ? statusConfig[step].color : '#BDC3C7',
                      fontWeight: isCurrent ? 'bold' : 'normal'
                    }}
                  >
                    {statusConfig[step].label}
                  </div>
                  {index < getStatusSteps().length - 1 && (
                    <div
                      style={{
                        ...styles.stepLine,
                        backgroundColor:
                          index < getCurrentStepIndex()
                            ? statusConfig[step].color
                            : '#BDC3C7'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.itemsSection}>
            <div style={styles.itemsTitle}>订单详情</div>
            {order.items.map((item, index) => (
              <div key={index} style={styles.orderItem}>
                <div style={styles.orderItemName}>
                  {item.name} × {item.quantity}
                </div>
                <div style={styles.orderItemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.totalSection}>
            <span style={styles.totalLabel}>合计</span>
            <span style={styles.totalValue}>{formatPrice(getTotalPrice())}</span>
          </div>

          {order.status === 'completed' && (
            <div style={styles.completedMessage}>
              🎉 您的订单已完成，请慢用！
            </div>
          )}
        </div>
      )}

      {!order && !error && !isTracking && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p style={styles.emptyText}>请输入订单号开始追踪</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0 20px',
    maxWidth: '500px',
    margin: '0 auto'
  },
  title: {
    fontSize: '24px',
    marginBottom: '8px',
    color: '#ECF0F1',
    textAlign: 'center' as const
  },
  subtitle: {
    fontSize: '14px',
    color: '#BDC3C7',
    marginBottom: '24px',
    textAlign: 'center' as const
  },
  searchSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #34495E',
    borderRadius: '8px',
    backgroundColor: '#34495E',
    color: '#ECF0F1',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '14px',
    backgroundColor: '#E67E22',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.2s ease'
  },
  errorMessage: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    color: '#E74C3C',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center' as const,
    marginBottom: '20px'
  },
  orderCard: {
    backgroundColor: '#34495E',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  orderHeader: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2C3E50'
  },
  orderIdLabel: {
    fontSize: '12px',
    color: '#BDC3C7'
  },
  orderId: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#ECF0F1'
  },
  seatInfo: {
    marginBottom: '20px',
    fontSize: '14px'
  },
  seatLabel: {
    color: '#BDC3C7'
  },
  seatValue: {
    color: '#ECF0F1',
    fontWeight: '500' as const
  },
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  statusLabel: {
    fontSize: '14px',
    color: '#BDC3C7'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    display: 'inline-block'
  },
  progressSection: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
    position: 'relative' as const
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
    position: 'relative' as const
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    zIndex: 1,
    transition: 'all 0.3s ease'
  },
  stepCircleCurrent: {
    transform: 'scale(1.2)',
    boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.2)'
  },
  stepLabel: {
    fontSize: '11px',
    textAlign: 'center' as const,
    transition: 'color 0.3s ease'
  },
  stepLine: {
    position: 'absolute' as const,
    top: '16px',
    left: '65%',
    width: '70%',
    height: '2px',
    transition: 'background-color 0.3s ease'
  },
  itemsSection: {
    marginBottom: '16px'
  },
  itemsTitle: {
    fontSize: '14px',
    color: '#BDC3C7',
    marginBottom: '12px'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px',
    color: '#ECF0F1'
  },
  orderItemName: {
    flex: 1
  },
  orderItemPrice: {
    fontWeight: '500' as const
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #2C3E50'
  },
  totalLabel: {
    fontSize: '14px',
    color: '#BDC3C7'
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#E67E22'
  },
  completedMessage: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: '8px',
    textAlign: 'center' as const,
    color: '#2ECC71',
    fontSize: '14px',
    fontWeight: '500' as const
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#BDC3C7'
  }
};

export default TrackingView;
