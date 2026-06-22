import React, { useEffect } from 'react';
import { useBookStore, ExchangeRequest } from '../store';
import { Inbox, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

const ExchangePage: React.FC = () => {
  const { exchanges, fetchExchanges, loading, error } = useBookStore();

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const getStatusBadge = (status: ExchangeRequest['status']) => {
    const statusMap = {
      pending: { text: '待确认', className: 'status-pending' },
      accepted: { text: '已交换', className: 'status-accepted' },
      rejected: { text: '已拒绝', className: 'status-rejected' }
    };
    const config = statusMap[status];
    return (
      <span className={`status-badge ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const incomingExchanges = exchanges.filter(e => e.toUser === '当前用户');
  const outgoingExchanges = exchanges.filter(e => e.fromUser === '当前用户');

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="exchanges-container">
      <h2>我的交换记录</h2>
      
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
        <ArrowLeft size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--warning-color)' }} />
        收到的交换请求
      </h3>
      <div className="exchanges-table" style={{ marginBottom: '32px' }}>
        <table>
          <thead>
            <tr>
              <th>书名</th>
              <th>请求方</th>
              <th>状态</th>
              <th>请求时间</th>
            </tr>
          </thead>
          <tbody>
            {incomingExchanges.length > 0 ? (
              incomingExchanges.map((exchange) => (
                <tr key={exchange.id}>
                  <td>{exchange.bookTitle}</td>
                  <td>{exchange.fromUser}</td>
                  <td>{getStatusBadge(exchange.status)}</td>
                  <td>{formatDate(exchange.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className="empty" style={{ padding: '40px 20px' }}>
                    <div className="empty-icon">
                      <Inbox size={36} />
                    </div>
                    <p>暂无收到的交换请求</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
        <ArrowRight size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--success-color)' }} />
        发起的交换请求
      </h3>
      <div className="exchanges-table">
        <table>
          <thead>
            <tr>
              <th>书名</th>
              <th>对方</th>
              <th>状态</th>
              <th>请求时间</th>
            </tr>
          </thead>
          <tbody>
            {outgoingExchanges.length > 0 ? (
              outgoingExchanges.map((exchange) => (
                <tr key={exchange.id}>
                  <td>{exchange.bookTitle}</td>
                  <td>{exchange.toUser}</td>
                  <td>{getStatusBadge(exchange.status)}</td>
                  <td>{formatDate(exchange.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className="empty" style={{ padding: '40px 20px' }}>
                    <div className="empty-icon">
                      <BookOpen size={36} />
                    </div>
                    <p>暂无发起的交换请求，快去浏览书籍发起交换吧！</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExchangePage;
