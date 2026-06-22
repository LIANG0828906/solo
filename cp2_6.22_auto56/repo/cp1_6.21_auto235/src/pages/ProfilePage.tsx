import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMessageContext } from '../App';

interface PublishedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  status: 'online' | 'offline';
  createdAt: string;
}

interface MessageItem {
  id: string;
  from: string;
  content: string;
  time: string;
  bookTitle: string;
}

interface RatingItem {
  id: string;
  from: string;
  stars: number;
  comment: string;
  date: string;
}

type TabType = 'published' | 'messages' | 'ratings';

const mockPublishedBooks: PublishedBook[] = [
  {
    id: 'p1',
    title: '数据结构（C语言版）',
    author: '严蔚敏',
    price: 15,
    status: 'online',
    createdAt: '2024-05-10',
  },
  {
    id: 'p2',
    title: '计算机网络（第七版）',
    author: '谢希仁',
    price: 28,
    status: 'online',
    createdAt: '2024-04-22',
  },
  {
    id: 'p3',
    title: '操作系统概念',
    author: 'Abraham Silberschatz',
    price: 35,
    status: 'offline',
    createdAt: '2024-03-15',
  },
];

const mockMessages: MessageItem[] = [
  {
    id: 'm1',
    from: '学弟小明',
    content: '你好，请问《数据结构》这本书还在吗？我想下午在图书馆见面交易可以吗？',
    time: '2024-06-20 15:30',
    bookTitle: '数据结构（C语言版）',
  },
  {
    id: 'm2',
    from: '同学小王',
    content: '请问能便宜点吗？20块可以吗？',
    time: '2024-06-19 10:15',
    bookTitle: '计算机网络（第七版）',
  },
];

const mockRatings: RatingItem[] = [
  {
    id: 'r1',
    from: '学姐小红',
    stars: 5,
    comment: '书本很新，卖家很nice，交易很愉快！',
    date: '2024-06-15',
  },
  {
    id: 'r2',
    from: '同学小李',
    stars: 4,
    comment: '书本和描述一致，发货很快，推荐！',
    date: '2024-05-28',
  },
];

const renderStars = (count: number) => '★'.repeat(count) + '☆'.repeat(5 - count);

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const [publishedBooks, setPublishedBooks] = useState<PublishedBook[]>(mockPublishedBooks);
  const [messages] = useState<MessageItem[]>(mockMessages);
  const [ratings] = useState<RatingItem[]>(mockRatings);
  const { currentUser, setUnreadCount, unreadCount } = useMessageContext();

  useEffect(() => {
    if (activeTab === 'messages' && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [activeTab]);

  const handleToggleStatus = async (bookId: string) => {
    setPublishedBooks(prev =>
      prev.map(book =>
        book.id === bookId
          ? { ...book, status: book.status === 'online' ? 'offline' : 'online' }
          : book
      )
    );
    try {
      await axios.put(`/api/books/${bookId}/toggle-status`);
    } catch {
    }
  };

  const handleEdit = (bookId: string) => {
    alert('编辑功能：可以在这里打开编辑弹窗');
  };

  const getInitial = (name: string) => name[0] || '?';

  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{getInitial(currentUser.username)}</div>
        <div className="profile-info">
          <h2>{currentUser.username}</h2>
          <p>{currentUser.email}</p>
          <p style={{ marginTop: '4px' }}>
            <span className="timeline-rating" style={{ color: '#F59E0B' }}>{renderStars(4)}</span>
            <span style={{ marginLeft: '8px', color: '#64748B', fontSize: '13px' }}>4.5 分 · 已完成 12 次交易</span>
          </p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          我发布的教材
        </button>
        <button
          className={`profile-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          收到的消息
          {unreadCount > 0 && (
            <span style={{
              display: 'inline-block',
              marginLeft: '6px',
              padding: '2px 6px',
              backgroundColor: '#EF4444',
              color: 'white',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`profile-tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          交易评价
        </button>
      </div>

      {activeTab === 'published' && (
        publishedBooks.length > 0 ? (
          <div className="published-books">
            {publishedBooks.map(book => (
              <div key={book.id} className="published-book-card">
                <div className="published-book-header">
                  <div className="published-book-title">{book.title}</div>
                  <div className="published-book-status">
                    <span className={`status-dot ${book.status === 'online' ? 'online' : 'offline'}`}></span>
                    {book.status === 'online' ? '在架' : '已下架'}
                  </div>
                </div>
                <div className="published-book-meta">
                  作者：{book.author}<br />
                  发布时间：{book.createdAt}
                </div>
                <div className="published-book-price">¥{book.price.toFixed(2)}</div>
                <div className="published-book-actions">
                  <button className="btn-primary" onClick={() => handleEdit(book.id)}>编辑</button>
                  <button
                    className={book.status === 'online' ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleToggleStatus(book.id)}
                  >
                    {book.status === 'online' ? '下架' : '上架'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-illustration">📚</div>
            <div className="empty-state-text">
              还没有发布任何教材<br />去发布你的第一本二手教材吧
            </div>
          </div>
        )
      )}

      {activeTab === 'messages' && (
        messages.length > 0 ? (
          <div className="messages-list">
            {messages.map(msg => (
            <div key={msg.id} className="message-item">
              <div className="message-avatar">{getInitial(msg.from)}</div>
              <div className="message-body">
                <div className="message-header">
                  <span className="message-sender">{msg.from}</span>
                  <span className="message-time">{msg.time}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#3B82F6', marginBottom: '6px' }}>
                  关于：{msg.bookTitle}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-illustration">✉️</div>
            <div className="empty-state-text">
              暂无消息<br />有消息会第一时间通知你
            </div>
          </div>
        )
      )}

      {activeTab === 'ratings' && (
        ratings.length > 0 ? (
          <div className="ratings-list">
            {ratings.map(rating => (
            <div key={rating.id} className="rating-item">
              <div className="rating-header">
                <span className="rating-from">{rating.from}</span>
                <span className="rating-stars">{renderStars(rating.stars)}</span>
              </div>
              <div className="rating-comment">{rating.comment}</div>
              <div className="rating-date">{rating.date}</div>
            </div>
          ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-illustration">⭐</div>
            <div className="empty-state-text">
              暂无评价<br />完成交易后会收到买家评价
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ProfilePage;
