import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '../store/useOrderStore';
import ChatPanel from '../components/ChatPanel';
import './OrderDetailPage.css';

let socket: Socket | null = null;

const typeLabels: Record<string, string> = {
  shopping: '🛒 凑满减',
  carpool: '🚗 拼车',
  food: '🍔 拼外卖',
};

const paymentLabels: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  received: '已到账',
};

const paymentColors: Record<string, string> = {
  pending: '#FF9800',
  paid: '#2196F3',
  received: '#4CAF50',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, setCurrentOrder, updateOrder, messages, setMessages, addMessage, user, addNotification } = useOrderStore();
  const [showFlash, setShowFlash] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/orders/${id}`);
      const data = await response.json();
      setCurrentOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  }, [id, setCurrentOrder]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/orders/${id}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  }, [id, setMessages]);

  useEffect(() => {
    socket = io('http://localhost:3002');

    socket.on('order-update', (updatedOrder) => {
      if (updatedOrder.id === id) {
        updateOrder(updatedOrder);
      }
    });

    socket.on('new-message', (message) => {
      if (message.orderId === id) {
        addMessage(message);
      }
    });

    socket.on('notification', (notification) => {
      if (notification.orderId === id) {
        addNotification(notification);
      }
    });

    fetchOrder();
    fetchMessages();

    const interval = setInterval(fetchOrder, 2000);

    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
  }, [id, updateOrder, addMessage, addNotification, fetchOrder, fetchMessages]);

  useEffect(() => {
    if (currentOrder && prevStatus && currentOrder.status !== prevStatus) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timer);
    }
    if (currentOrder && !prevStatus) {
      setPrevStatus(currentOrder.status);
    }
  }, [currentOrder?.status, prevStatus]);

  useEffect(() => {
    if (currentOrder) {
      setPrevStatus(currentOrder.status);
    }
  }, [currentOrder?.id]);

  const handleJoinOrder = async () => {
    if (!currentOrder || currentOrder.currentMembers >= currentOrder.targetMembers) return;

    const isMember = currentOrder.members.some((m) => m.userId === user.id);
    if (isMember) return;

    if (currentOrder.matchRule?.autoRejectBelow) {
      const shareAmount = currentOrder.totalAmount / currentOrder.targetMembers;
      if (shareAmount < currentOrder.matchRule.autoRejectBelow) {
        alert('您的拼单金额低于发起人设置的最低要求');
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:3002/api/orders/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateOrder(data.order);
      } else {
        alert(data.message || '加入失败');
      }
    } catch (error) {
      console.error('Failed to join order:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await fetch(`http://localhost:3002/api/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      const mockMsg = {
        id: 'msg-' + Date.now(),
        orderId: id!,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content,
        timestamp: new Date().toISOString(),
        type: 'user' as const,
      };
      addMessage(mockMsg);
    }
  };

  const handleUpdatePaymentStatus = async (status: 'pending' | 'paid' | 'received') => {
    if (!currentOrder) return;
    try {
      const response = await fetch(`http://localhost:3002/api/orders/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateOrder(data.order);
      }
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  if (!currentOrder) {
    return (
      <div className="order-detail-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const isMember = currentOrder.members.some((m) => m.userId === user.id);
  const isCompleted = currentOrder.status === 'completed' || currentOrder.status === 'archived';
  const canJoin = !isMember && !isCompleted && currentOrder.currentMembers < currentOrder.targetMembers;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-detail-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← 返回
      </button>

      <div className="detail-container">
        <div className="detail-main">
          <div className={`order-info-card glass-card ${showFlash ? 'flash-green' : ''} ${isCompleted ? 'completed-card' : ''}`}>
            <div className="order-header">
              <span className="order-type">{typeLabels[currentOrder.type]}</span>
              {isCompleted && <span className="order-status completed">✓ 已完成</span>}
              {!isCompleted && <span className="order-status active">进行中</span>}
            </div>

            <h1 className="order-title">{currentOrder.title}</h1>

            <div className="order-creator">
              <img src={currentOrder.creatorAvatar} alt={currentOrder.creatorName} />
              <div>
                <span className="creator-name">{currentOrder.creatorName}</span>
                <span className="creator-label">发起人</span>
              </div>
            </div>

            <div className="order-stats">
              <div className="stat-item">
                <span className="stat-label">总金额</span>
                <span className="stat-value amount">¥{currentOrder.totalAmount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">人均分摊</span>
                <span className="stat-value">¥{(currentOrder.totalAmount / currentOrder.targetMembers).toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">参与人数</span>
                <span className="stat-value">{currentOrder.currentMembers}/{currentOrder.targetMembers}</span>
              </div>
            </div>

            <div className="order-deadline">
              <span className="deadline-label">截止时间：</span>
              <span className="deadline-value">{formatTime(currentOrder.deadline)}</span>
            </div>

            {currentOrder.matchRule && (
              <div className="match-rules-info">
                <h4>自动匹配规则</h4>
                <ul>
                  {currentOrder.matchRule.minAmount && (
                    <li>最低拼单金额：¥{currentOrder.matchRule.minAmount}</li>
                  )}
                  {currentOrder.matchRule.maxMembers && (
                    <li>最多可加入人数：{currentOrder.matchRule.maxMembers}人</li>
                  )}
                  {currentOrder.matchRule.autoRejectBelow && (
                    <li>自动拒绝低于 ¥{currentOrder.matchRule.autoRejectBelow} 的搭单请求</li>
                  )}
                </ul>
              </div>
            )}

            {canJoin && (
              <button className="join-button" onClick={handleJoinOrder}>
                加入拼单
              </button>
            )}

            {isMember && !isCompleted && (
              <div className="payment-actions">
                <p>我的支付状态</p>
                <div className="payment-buttons">
                  <button
                    className={`payment-btn pending`}
                    onClick={() => handleUpdatePaymentStatus('pending')}
                  >
                    待支付
                  </button>
                  <button
                    className={`payment-btn paid`}
                    onClick={() => handleUpdatePaymentStatus('paid')}
                  >
                    已支付
                  </button>
                  <button
                    className={`payment-btn received`}
                    onClick={() => handleUpdatePaymentStatus('received')}
                  >
                    已到账
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="members-card glass-card">
            <h3>成员列表</h3>
            <div className="members-list">
              {currentOrder.members.map((member) => (
                <div
                  key={member.userId}
                  className={`member-item ${showFlash ? 'flash-member' : ''}`}
                >
                  <img src={member.userAvatar} alt={member.userName} className="member-avatar" />
                  <div className="member-info">
                    <span className="member-name">
                      {member.userName}
                      {member.userId === currentOrder.creatorId && (
                        <span className="creator-badge">发起人</span>
                      )}
                    </span>
                    <span className="member-amount">¥{member.shareAmount.toFixed(2)}</span>
                  </div>
                  <span
                    className="payment-status"
                    style={{ backgroundColor: paymentColors[member.paymentStatus] }}
                  >
                    {paymentLabels[member.paymentStatus]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
