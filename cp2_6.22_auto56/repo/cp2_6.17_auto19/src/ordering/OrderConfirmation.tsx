import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { RoleSwitcher } from '../components/RoleSwitcher';
import './OrderConfirmation.css';

export const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const setCurrentOrderById = useAppStore(state => state.setCurrentOrderById);
  const currentOrder = useAppStore(state => state.currentOrder);
  const [countdown, setCountdown] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (orderId) {
      setCurrentOrderById(orderId);
    }
  }, [orderId, setCurrentOrderById]);

  useEffect(() => {
    if (!currentOrder) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = currentOrder.estimatedTime - now;

      if (remaining <= 0) {
        setIsOverdue(true);
        setCountdown('00:00');
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentOrder]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatEstimatedTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentOrder) {
    return (
      <div className="order-confirmation">
        <header className="confirmation-header">
          <h1 className="app-logo">OrderFlow</h1>
          <RoleSwitcher />
        </header>
        <div className="loading-container">
          <span className="material-icons loading-spin">sync</span>
          <p>加载订单信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <header className="confirmation-header">
        <div className="header-left">
          <h1 className="app-logo">OrderFlow</h1>
          <p className="header-subtitle">订单确认</p>
        </div>
        <RoleSwitcher />
      </header>

      <main className="confirmation-main">
        <div className="confirmation-card animate-fade-in-scale">
          <div className="success-icon">
            <span className="material-icons">check_circle</span>
          </div>

          <h2 className="confirmation-title">下单成功！</h2>
          <p className="confirmation-subtitle">您的订单已提交，请稍候</p>

          <div className="order-info">
            <div className="order-no-section">
              <span className="info-label">订单号</span>
              <span className="order-no">{currentOrder.orderNo}</span>
            </div>

            <div className="order-time-section">
              <div className="time-item">
                <span className="material-icons">schedule</span>
                <div>
                  <span className="info-label">下单时间</span>
                  <span className="info-value">{formatTime(currentOrder.createdAt)}</span>
                </div>
              </div>
              <div className="time-item">
                <span className="material-icons">timer</span>
                <div>
                  <span className="info-label">预计完成</span>
                  <span className="info-value">{formatEstimatedTime(currentOrder.estimatedTime)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="countdown-section">
            <span className="countdown-label">预计等待</span>
            <span className={`countdown-timer ${isOverdue ? 'overdue' : ''}`}>
              {countdown}
            </span>
          </div>

          <div className="order-items">
            <h3 className="items-title">订单详情</h3>
            <div className="items-list">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="order-item-row">
                  <span className="item-emoji">{item.emoji}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-qty">x{item.quantity}</span>
                  <span className="item-price">¥{(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>总计</span>
              <span className="total-amount">¥{currentOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => navigate('/')}>
              继续点餐
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
