import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore, api } from '../store';

const DashboardPage = () => {
  const { user, myBooks, fetchMyBooks, myNotes, fetchMyNotes, exchanges, fetchExchanges } = useAppStore();

  useEffect(() => {
    if (user) {
      fetchMyBooks();
      fetchMyNotes();
      fetchExchanges();
    }
  }, [user, fetchMyBooks, fetchMyNotes, fetchExchanges]);

  const acceptExchange = async (exchangeId: number) => {
    try {
      await api.put(`/users/exchanges/${exchangeId}/accept`);
      alert('已同意交换');
      fetchMyBooks();
      fetchExchanges();
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  if (!user) return <Navigate to="/" />;

  const renderStatus = (status: string) => {
    switch (status) {
      case 'exchanging': return <span className="status-exchanging-text">交换中</span>;
      case 'completed': return <span className="status-completed-text">已完成</span>;
      default: return <span className="status-available-text">可交换</span>;
    }
  };

  const renderExchangeStatus = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="status-completed-text">已同意</span>;
      case 'rejected': return <span className="status-exchanging-text">已拒绝</span>;
      case 'completed': return <span className="status-completed-text">已完成</span>;
      default: return <span className="status-exchanging-text">待处理</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="page">
      <h1 className="page-title">用户仪表盘</h1>
      <p style={{ color: '#7F8C8D', marginBottom: 24 }}>欢迎回来，{user.username}！</p>

      <div className="dashboard">
        <div className="dashboard-col">
          <h3 className="dashboard-col-title">我的教材</h3>
          {myBooks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>暂无教材</div>
          ) : (
            <div className="dashboard-list">
              {myBooks.map((book) => (
                <div key={book.id} className="dashboard-item">
                  <div className="dashboard-item-title">{book.title}</div>
                  <div className="dashboard-item-meta">
                    {book.author} · ¥{book.price} · {renderStatus(book.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-col">
          <h3 className="dashboard-col-title">我的众筹</h3>
          {myNotes.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>暂无参与众筹</div>
          ) : (
            <div className="dashboard-list">
              {myNotes.map((note) => {
                const unlocked = note.current_amount >= note.target_amount;
                return (
                  <div key={note.id} className="dashboard-item">
                    <div className="dashboard-item-title">{note.title}</div>
                    <div className="dashboard-item-meta">
                      {note.subject} · ¥{note.current_amount}/{note.target_amount} · 
                      <span style={{ color: unlocked ? '#2ECC71' : '#E67E22', marginLeft: 4 }}>
                        {unlocked ? '已解锁' : '众筹中'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-col">
          <h3 className="dashboard-col-title">交换记录</h3>
          {exchanges.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 10px' }}>暂无交换记录</div>
          ) : (
            <div className="dashboard-list">
              {exchanges.map((ex) => {
                const isOwner = ex.owner_id === user.id;
                const otherName = isOwner ? ex.requester_name : ex.owner_name;
                return (
                  <div key={ex.id} className="dashboard-item">
                    <div className="dashboard-item-title">{ex.book_title}</div>
                    <div className="dashboard-item-meta">
                      {formatDate(ex.created_at)} · {isOwner ? '申请人：' : '对方：'}{otherName}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        {renderExchangeStatus(ex.status)}
                        {isOwner && ex.status === 'pending' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => acceptExchange(ex.id)}
                          >
                            同意
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
