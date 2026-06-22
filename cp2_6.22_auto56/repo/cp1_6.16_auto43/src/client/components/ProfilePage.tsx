import React, { useState, useEffect } from 'react';
import { SeedItem, ExchangeRequest } from '../../types';
import { api } from '../api';

interface ProfilePageProps {
  currentUser: string;
  onCancelRequest: (id: string) => void;
  onConfirmRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onCancelRequest,
  onConfirmRequest,
  onRejectRequest,
}) => {
  const [myItems, setMyItems] = useState<SeedItem[]>([]);
  const [myRequests, setMyRequests] = useState<ExchangeRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ExchangeRequest[]>([]);
  const [history, setHistory] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [items, requestsFrom, requestsTo, completed] = await Promise.all([
          api.getUserItems(currentUser),
          api.getRequestsFrom(currentUser),
          api.getRequestsTo(currentUser),
          api.getCompletedHistory(currentUser),
        ]);
        setMyItems(items);
        setMyRequests(requestsFrom);
        setReceivedRequests(requestsTo);
        setHistory(completed);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待确认';
      case 'confirmed': return '已确认';
      case 'cancelled': return '已取消';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleCancel = async (id: string) => {
    await onCancelRequest(id);
    const updated = await api.getRequestsFrom(currentUser);
    setMyRequests(updated);
  };

  const handleConfirm = async (id: string) => {
    await onConfirmRequest(id);
    const [updatedReceived, updatedItems, updatedHistory] = await Promise.all([
      api.getRequestsTo(currentUser),
      api.getUserItems(currentUser),
      api.getCompletedHistory(currentUser),
    ]);
    setReceivedRequests(updatedReceived);
    setMyItems(updatedItems);
    setHistory(updatedHistory);
  };

  const handleReject = async (id: string) => {
    await onRejectRequest(id);
    const updated = await api.getRequestsTo(currentUser);
    setReceivedRequests(updated);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <h2>👤 {currentUser}</h2>
          <p>欢迎回到您的个人主页</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666' }}>
          <div>
            <strong style={{ color: '#2e7d32', fontSize: '20px' }}>{myItems.length}</strong>
            <div>发布的条目</div>
          </div>
          <div>
            <strong style={{ color: '#2e7d32', fontSize: '20px' }}>{myRequests.length}</strong>
            <div>发出的请求</div>
          </div>
          <div>
            <strong style={{ color: '#2e7d32', fontSize: '20px' }}>{receivedRequests.filter(r => r.status === 'pending').length}</strong>
            <div>待处理请求</div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">🌱 我发布的条目</h3>
        {myItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>您还没有发布任何条目</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {myItems.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 0, cursor: 'default' }}>
                <div className="card-image">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.seedName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '🌱'
                  )}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{item.seedName}</h3>
                  <div className="card-meta">
                    <span className="meta-tag">{item.variety}</span>
                    <span className="meta-tag">📍 {item.location}</span>
                    <span className="meta-tag">剩余: {item.quantity}</span>
                  </div>
                  <p className="card-expected">
                    <strong>期望交换：</strong>
                    {item.expectedExchange}
                  </p>
                  <div className="card-footer">
                    <span className="card-owner">
                      发布于 {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">📤 我发出的请求</h3>
        {myRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📤</div>
            <p>您还没有发出任何交换请求</p>
          </div>
        ) : (
          myRequests.map((request) => (
            <div key={request.id} className="request-item">
              <div className="request-header">
                <span className="request-title">
                  请求交换：{request.seedItem.seedName}（{request.exchangeQuantity}份）
                </span>
                <span className={`request-status status-${request.status}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="request-meta">
                发给：{request.toUser} | 创建时间：{formatDate(request.createdAt)}
              </div>
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(request.id)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    取消请求
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="section">
        <h3 className="section-title">📥 我收到的请求</h3>
        {receivedRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📥</div>
            <p>您还没有收到任何交换请求</p>
          </div>
        ) : (
          receivedRequests.map((request) => (
            <div key={request.id} className="request-item">
              <div className="request-header">
                <span className="request-title">
                  {request.fromUser} 请求交换：{request.seedItem.seedName}（{request.exchangeQuantity}份）
                </span>
                <span className={`request-status status-${request.status}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className="request-meta">
                创建时间：{formatDate(request.createdAt)}
                {request.status === 'pending' && request.seedItem.quantity < request.exchangeQuantity && (
                  <span style={{ color: '#f44336', marginLeft: '8px' }}>
                    ⚠️ 库存不足
                  </span>
                )}
              </div>
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConfirm(request.id)}
                    disabled={request.seedItem.quantity < request.exchangeQuantity}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    确认交换
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(request.id)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    拒绝
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="section">
        <h3 className="section-title">📜 历史完成记录</h3>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <p>还没有完成的交换记录</p>
          </div>
        ) : (
          history.map((request) => (
            <div key={request.id} className="request-item">
              <div className="request-header">
                <span className="request-title">
                  {request.fromUser === currentUser ? '您' : request.fromUser} ↔{' '}
                  {request.toUser === currentUser ? '您' : request.toUser} ：
                  {request.seedItem.seedName}（{request.exchangeQuantity}份）
                </span>
                <span className={`request-status status-${request.status}`}>
                  已完成
                </span>
              </div>
              <div className="request-meta">
                完成时间：{formatDate(request.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
