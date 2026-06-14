import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getBookById, getUserById, subscribe } from '../../shared/dataStore';
import ExchangeModal from '../exchange/ExchangeModal';
import type { Book } from '../../shared/dataStore';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | undefined>(() => getBookById(id || ''));
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setBook(getBookById(id || ''));
    });
    return unsubscribe;
  }, [id]);

  if (!book) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <div className="empty-state-text">书籍未找到</div>
          <Link to="/" style={{ marginTop: 16, display: 'inline-block' }}>返回书籍列表</Link>
        </div>
      </div>
    );
  }

  const owner = getUserById(book.ownerId);
  const isOwner = user?.id === book.ownerId;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">二手书交换</Link>
        </div>
        <div className="navbar-links">
          <Link to="/">书籍列表</Link>
          <Link to="/exchange-history">交换记录</Link>
          <div className="nav-user">
            <span className="nav-user-nickname">{user?.nickname}</span>
            <button className="btn-logout" onClick={() => {
              navigate('/login', { replace: true });
            }}>登出</button>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <div className="book-detail">
          <Link to="/" className="back-link">← 返回列表</Link>

          <div className="book-detail-header">
            <img className="book-detail-cover" src={book.coverUrl} alt={book.title} />
            <div className="book-detail-info">
              <h1 className="book-detail-title">{book.title}</h1>
              <div className="book-detail-author">{book.author}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`book-card-tag ${book.category === '小说' ? 'tag-equal' : book.category === '科技' ? 'tag-low' : book.category === '教育' ? 'tag-free' : 'tag-equal'}`}>
                  {book.category}
                </span>
                {book.status === '交换中' ? (
                  <span className="book-card-tag tag-exchanging">交换中</span>
                ) : (
                  <span className={`book-card-tag ${book.exchangeType === '免费赠予' ? 'tag-free' : book.exchangeType === '等价交换' ? 'tag-equal' : 'tag-low'}`}>
                    {book.exchangeType}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-brown-light)' }}>📍 {book.city}</div>
              <p className="book-detail-desc">{book.description}</p>
              {!isOwner && book.status !== '交换中' && (
                <div className="book-detail-actions">
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    交换此书
                  </button>
                  <button className="btn-outline" onClick={() => setShowModal(true)}>
                    联系主人
                  </button>
                </div>
              )}
              {book.status === '交换中' && !isOwner && (
                <div style={{ color: 'var(--color-orange)', fontWeight: 600, fontSize: '0.9rem' }}>
                  此书正在交换中，请稍后再试
                </div>
              )}
            </div>
          </div>

          <h3 className="section-title">书籍主人</h3>
          {owner && (
            <div className="owner-card">
              <div className="owner-avatar">{owner.nickname[0]}</div>
              <div className="owner-info">
                <div className="owner-nickname">{owner.nickname}</div>
                <div className="owner-meta">
                  <span className="owner-credit">⭐ {owner.creditLevel}</span>
                  <span style={{ marginLeft: 12 }}>已完成 {owner.completedExchanges} 次交换</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {showModal && book && (
          <ExchangeModal
            book={book}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </>
  );
}
