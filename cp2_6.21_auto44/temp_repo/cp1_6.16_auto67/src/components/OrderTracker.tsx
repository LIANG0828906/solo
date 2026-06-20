import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Stall } from '../types';

interface OrderTrackerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  stalls: Stall[];
}

const statusStages = [
  { status: OrderStatus.PLACED, label: '已下单' },
  { status: OrderStatus.PREPARING, label: '制作中' },
  { status: OrderStatus.READY, label: '已完成' },
  { status: OrderStatus.PICKED_UP, label: '已取餐' }
];

export default function OrderTracker({ orders, onUpdateOrderStatus, stalls }: OrderTrackerProps) {
  const navigate = useNavigate();
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});

  const sortedOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt);

  useEffect(() => {
    const initialProgress: Record<string, number> = {};
    sortedOrders.forEach((order, index) => {
      setTimeout(() => {
        const statusIndex = statusStages.findIndex(s => s.status === order.status);
        initialProgress[order.id] = statusIndex;
        setAnimatedProgress(prev => ({ ...prev, [order.id]: statusIndex }));
      }, index * 100);
    });
  }, [sortedOrders.length]);

  const getStallName = (stallId: string) => {
    const stall = stalls.find(s => s.id === stallId);
    return stall?.name || '未知摊位';
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PLACED: return '#3498DB';
      case OrderStatus.PREPARING: return '#E85D2C';
      case OrderStatus.READY: return '#2ECC71';
      case OrderStatus.PICKED_UP: return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  const isStagePassed = (orderStatus: OrderStatus, stageStatus: OrderStatus) => {
    const orderIndex = statusStages.findIndex(s => s.status === orderStatus);
    const stageIndex = statusStages.findIndex(s => s.status === stageStatus);
    return stageIndex <= orderIndex;
  };

  const isCurrentStage = (orderStatus: OrderStatus, stageStatus: OrderStatus) => {
    return orderStatus === stageStatus;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h1 style={styles.title}>我的订单</h1>
        <div style={{ width: '60px' }}></div>
      </div>

      <div style={styles.content}>
        {sortedOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🍽️</div>
            <p style={styles.emptyText}>暂无订单</p>
            <button style={styles.browseButton} onClick={() => navigate('/')}>
              去逛逛
            </button>
          </div>
        ) : (
          <div style={styles.orderList}>
            {sortedOrders.map((order, index) => (
              <div
                key={order.id}
                className="stagger-item"
                style={{
                  ...styles.orderCard,
                  animationDelay: `${index * 0.1}s`,
                  opacity: order.status === OrderStatus.PICKED_UP ? 0.7 : 1
                }}
              >
                <div style={styles.orderHeader}>
                  <div>
                    <span style={styles.orderNumber}>订单号 #{order.id.slice(-4)}</span>
                    <span style={styles.stallName}>{getStallName(order.stallId)}</span>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(order.status),
                    animation: order.status === OrderStatus.PREPARING ? 'pulse 2s ease-in-out infinite' : 'none'
                  }}>
                    {order.status}
                  </span>
                </div>

                <div style={styles.orderItems}>
                  {order.items.map((item, i) => (
                    <div key={i} style={styles.orderItem}>
                      <span style={styles.itemName}>{item.name}</span>
                      <span style={styles.itemQty}>×{item.quantity}</span>
                      <span style={styles.itemPrice}>¥{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.progressSection}>
                  <div style={styles.progressBar}>
                    {statusStages.map((stage, stageIndex) => (
                      <div key={stage.status} style={styles.stageContainer}>
                        <div style={{
                          ...styles.stageDot,
                          backgroundColor: isStagePassed(order.status, stage.status)
                            ? getStatusColor(stage.status)
                            : '#DDD',
                          borderColor: isStagePassed(order.status, stage.status)
                            ? getStatusColor(stage.status)
                            : '#DDD',
                          boxShadow: isCurrentStage(order.status, stage.status)
                            ? `0 0 0 4px ${getStatusColor(stage.status)}30`
                            : 'none',
                          transition: 'all 0.5s ease'
                        }}>
                          {isStagePassed(order.status, stage.status) && stageIndex < statusStages.length - 1 && (
                            <span style={styles.checkmark}>✓</span>
                          )}
                        </div>
                        {stageIndex < statusStages.length - 1 && (
                          <div style={{
                            ...styles.stageLine,
                            backgroundColor: isStagePassed(order.status, statusStages[stageIndex + 1].status)
                              ? getStatusColor(statusStages[stageIndex + 1].status)
                              : '#E0E0E0',
                            transition: 'background-color 0.5s ease'
                          }}></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={styles.progressLabels}>
                    {statusStages.map(stage => (
                      <span key={stage.status} style={{
                        ...styles.stageLabel,
                        color: isStagePassed(order.status, stage.status) ? '#3D2B1F' : '#AAA'
                      }}>
                        {stage.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={styles.orderFooter}>
                  <span style={styles.orderTime}>{formatTime(order.createdAt)}</span>
                  <span style={styles.orderTotal}>合计 ¥{order.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFF8EE'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  backButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    width: '60px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'white',
    margin: 0
  },
  content: {
    padding: '20px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#8B7355',
    marginBottom: '24px'
  },
  browseButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '24px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 44, 0.3)'
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'opacity 0.3s ease'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  orderNumber: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: '#3D2B1F',
    marginBottom: '4px'
  },
  stallName: {
    fontSize: '13px',
    color: '#8B7355'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white'
  },
  orderItems: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px dashed #E0D5C5'
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0'
  },
  itemName: {
    flex: 1,
    fontSize: '14px',
    color: '#5D4E37'
  },
  itemQty: {
    fontSize: '13px',
    color: '#8B7355',
    marginRight: '16px'
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#3D2B1F'
  },
  progressSection: {
    marginBottom: '16px'
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  stageContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1
  },
  stageDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    flexShrink: 0,
    zIndex: 1
  },
  checkmark: {
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  stageLine: {
    flex: 1,
    height: '3px',
    margin: '0 4px',
    borderRadius: '2px',
    transition: 'background-color 0.5s ease'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  stageLabel: {
    fontSize: '11px',
    textAlign: 'center',
    flex: 1,
    transition: 'color 0.3s ease'
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderTime: {
    fontSize: '12px',
    color: '#8B7355'
  },
  orderTotal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#E85D2C'
  }
};
