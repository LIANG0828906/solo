import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getExchangeRequestsByUser,
  getBookById,
  getUserById,
  markExchangeAsRead,
  updateExchangeStatus,
  subscribe,
} from '../../shared/dataStore';
import type { ExchangeRequest } from '../../shared/dataStore';

export default function ExchangeHistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setRequests(getExchangeRequestsByUser(user.id));
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (user) {
        setRequests(getExchangeRequestsByUser(user.id));
      }
    });
    return unsubscribe;
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleClick = (request: ExchangeRequest) => {
    if (request.ownerId === user?.id && !request.isRead) {
      markExchangeAsRead(request.id);
    }
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    updateExchangeStatus(requestId, newStatus);
  };

  const sortedRequests = [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sentRequests = sortedRequests.filter((r) => r.requesterId === user?.id);
  const receivedRequests = sortedRequests.filter((r) => r.ownerId === user?.id);

  const renderStatusBadge = (status: string) => {
    const cls =
      status === '待确认' ? 'status-pending' :
      status === '已接受' ? 'status-accepted' :
      status === '已拒绝' ? 'status-rejected' : 'status-completed';
    return <span className={`status-badge ${cls}`}>{status}</span>;
  };

  const renderRequest = (request: ExchangeRequest) => {
    const book = getBookById(request.bookId);
    const otherUser = request.requesterId === user?.id
      ? getUserById(request.ownerId)
      : getUserById(request.requesterId);
    const isReceived = request.ownerId === user?.id;
    const unread = isReceived && !request.isRead;

    return (
      <div
        key={request.id}
        className={`exchange-item ${unread ? 'unread' : ''}`}
        onClick={() => handleClick(request)}
      >
        {unread && <div className="unread-dot" />}
        {book && (
          <img className="exchange-item-cover" src={book.coverUrl} alt={book.title} />
        )}
        <div className="exchange-item-info">
          <div className="exchange-item-title">{book?.title || '未知书籍'}</div>
          <div className="exchange-item-user">
            {isReceived ? '来自' : '发给'}：{otherUser?.nickname || '未知用户'}
          </div>
          {request.message && (
            <div className="exchange-item-message">{request.message}</div>
          )}
        </div>
        <div className="exchange-item-right">
          {renderStatusBadge(request.status)}
          {isReceived && request.status === '待确认' && (
            <div className="status-actions">
              <button
                className="btn-small btn-accept"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, '已接受'); }}
              >
                接受
              </button>
              <button
                className="btn-small btn-reject"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, '已拒绝'); }}
              >
                拒绝
              </button>
            </div>
          )}
          {isReceived && request.status === '已接受' && (
            <div className="status-actions">
              <button
                className="btn-small btn-complete"
                onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, '已完成'); }}
              >
                完成交换
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">二手书交换</Link>
        </div>
        <div className="navbar-links">
          <Link to="/">书籍列表</Link>
          <Link to="/exchange-history" className="active">交换记录</Link>
          <div className="nav-user">
            <span className="nav-user-nickname">{user?.nickname}</span>
            <button className="btn-logout" onClick={handleLogout}>登出</button>
          </div>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>书籍列表</Link>
        <Link to="/exchange-history" onClick={() => setMenuOpen(false)}>交换记录</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ color: 'var(--color-mint)' }}>{user?.nickname}</span>
          <button className="btn-logout" onClick={handleLogout}>登出</button>
        </div>
      </div>

      <div className="page-container">
        <h1 className="page-title">交换记录</h1>

        {sentRequests.length === 0 && receivedRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无交换记录</div>
          </div>
        ) : (
          <>
            {sentRequests.length > 0 && (
              <>
                <h3 className="section-title">我发起的交换</h3>
                <div className="exchange-list">
                  {sentRequests.map(renderRequest)}
                </div>
              </>
            )}
            {receivedRequests.length > 0 && (
              <>
                <h3 className="section-title">我收到的请求</h3>
                <div className="exchange-list">
                  {receivedRequests.map(renderRequest)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
