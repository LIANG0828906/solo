import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useOrderCountdown, orderManager } from './OrderManager';
import { Order } from '../shared/types';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { startCrossTabSync } from '../utils/socketMock';
import './KitchenDisplay.css';

interface OrderCardProps {
  order: Order;
  isNew?: boolean;
  isCompleted?: boolean;
  onComplete?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isNew, isCompleted, onComplete }) => {
  const { formatted, isOverdue } = useOrderCountdown(order.estimatedTime);
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 500);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`order-card ${isNew ? 'animate-slide-in-right' : ''} ${isExiting ? 'animate-slide-out-left' : ''} ${isCompleted ? 'completed' : ''}`}
    >
      <div className={`order-status-bar ${isCompleted ? 'status-completed' : 'status-pending'}`} />
      
      <div className="order-card-content">
        <div className="order-card-header">
          <h3 className="order-no">{order.orderNo}</h3>
          <span className="order-time">
            <span className="material-icons">schedule</span>
            {formatTime(order.createdAt)}
          </span>
        </div>

        <div className="order-items-list">
          {order.items.map((item, index) => (
            <div key={index} className="order-item-line">
              <span className="item-emoji">{item.emoji}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-qty">×{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="order-card-footer">
          <div className={`countdown-display ${isOverdue && !isCompleted ? 'overdue' : ''}`}>
            <span className="material-icons">timer</span>
            <span className="countdown-value">{formatted}</span>
          </div>
          
          {!isCompleted && (
            <button className="complete-btn" onClick={handleComplete}>
              <span className="material-icons">check</span>
              完成
            </button>
          )}
          
          {isCompleted && (
            <div className="completed-badge">
              <span className="material-icons">check_circle</span>
              已完成
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const KitchenDisplay: React.FC = () => {
  const pendingOrders = useAppStore(state => state.pendingOrders);
  const completedOrders = useAppStore(state => state.completedOrders);
  const loadOrders = useAppStore(state => state.loadOrders);
  const completeOrder = useAppStore(state => state.completeOrder);
  const handleNewOrder = useAppStore(state => state.handleNewOrder);
  const handleOrderComplete = useAppStore(state => state.handleOrderComplete);

  useEffect(() => {
    orderManager.init();
    loadOrders();
    
    const cleanup = startCrossTabSync(
      (order) => handleNewOrder(order),
      (orderId) => handleOrderComplete(orderId)
    );

    return cleanup;
  }, [loadOrders, handleNewOrder, handleOrderComplete]);

  return (
    <div className="kitchen-display">
      <header className="kitchen-header">
        <div className="header-left">
          <h1 className="app-logo">OrderFlow 后厨</h1>
          <p className="header-subtitle">
            <span className="material-icons">restaurant</span>
            待处理订单: <strong>{pendingOrders.length}</strong>
          </p>
        </div>
        <RoleSwitcher />
      </header>

      <main className="kitchen-main">
        <section className="pending-section">
          <div className="section-header">
            <h2>
              <span className="material-icons">pending_actions</span>
              待处理订单
            </h2>
            <span className="order-count">{pendingOrders.length} 单</span>
          </div>
          
          <div className="orders-scroll-container">
            {pendingOrders.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons">check_circle_outline</span>
                <p>暂无待处理订单</p>
              </div>
            ) : (
              <div className="orders-flow">
                {pendingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isNew
                    onComplete={() => completeOrder(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="completed-section">
          <div className="section-header">
            <h2>
              <span className="material-icons">done_all</span>
              已完成
            </h2>
          </div>
          
          <div className="completed-orders">
            {completedOrders.map(order => (
              <OrderCard key={order.id} order={order} isCompleted />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
