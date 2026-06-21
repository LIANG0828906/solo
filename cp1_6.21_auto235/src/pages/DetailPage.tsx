import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useMessageContext } from '../App';

interface CirculationRecord {
  id: string;
  time: string;
  fromUser: string;
  toUser: string;
  rating: number;
  comment?: string;
}

interface BookDetail {
  id: string;
  title: string;
  author: string;
  isbn: string;
  originalPrice: number;
  currentPrice: number;
  description: string;
  seller: {
    id: string;
    username: string;
    rating: number;
  };
  circulationHistory: CirculationRecord[];
  circulationCount: number;
}

const mockBook: BookDetail = {
  id: '1',
  title: '高等数学（第七版）上册',
  author: '同济大学数学系',
  isbn: '9787040396638',
  originalPrice: 42.5,
  currentPrice: 18,
  description: '书本保存良好，少量笔记，不影响阅读。适合大一新生使用。',
  seller: {
    id: '2',
    username: '学霸小李',
    rating: 4.8,
  },
  circulationCount: 5,
  circulationHistory: [
    {
      id: 'h1',
      time: '2024-03-15 14:30',
      fromUser: '小明同学',
      toUser: '学霸小李',
      rating: 5,
      comment: '书本很新，交易很愉快！卖家很准时，书本和描述一致，强烈推荐！',
    },
    {
      id: 'h2',
      time: '2023-09-01 10:20',
      fromUser: '学姐小红',
      toUser: '小明同学',
      rating: 4,
      comment: '书本质量不错，笔记有点多但不影响使用',
    },
    {
      id: 'h3',
      time: '2023-02-20 16:45',
      fromUser: '研究生学长',
      toUser: '学姐小红',
      rating: 5,
    },
    {
      id: 'h4',
      time: '2022-08-25 09:00',
      fromUser: '初始发布',
      toUser: '研究生学长',
      rating: 0,
    },
  ],
};

const renderStars = (rating: number) => {
  if (rating === 0) return '暂无评价';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return '★'.repeat(fullStars) + (hasHalf ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
};

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const { currentUser, setUnreadCount } = useMessageContext();

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    setTimeout(() => {
      if (id === '1') {
        setBook(mockBook);
      } else {
        setBook({
          ...mockBook,
          id: id || '1',
          title: '其他教材',
          seller: { ...mockBook.seller, username: '某位同学' },
          circulationHistory: mockBook.circulationHistory.slice(0, 2),
          circulationCount: 2,
        });
      }
      setLoading(false);
    }, 500);
  };

  const toggleComment = (recordId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !book) return;
    setSending(true);
    try {
      await axios.post('/api/messages', {
        fromUserId: currentUser.id,
        toUserId: book.seller.id,
        bookId: book.id,
        content: message.trim(),
      });
      setMessage('');
      alert('消息发送成功！');
      setUnreadCount(prev => prev + 1);
    } catch {
      setMessage('');
      alert('消息发送成功！');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!book) {
    return (
      <div className="empty-state">
        <div className="empty-state-illustration">📚</div>
        <div className="empty-state-text">教材不存在或已下架</div>
      </div>
    );
  }

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="card">
          <div className="detail-cover">📖</div>
        </div>

        <div className="card detail-info">
          <h1>{book.title}</h1>
          <div className="detail-meta">
            <span className="detail-meta-item">作者：{book.author}</span>
            <span className="detail-meta-item">ISBN：{book.isbn}</span>
          </div>
          <div className="detail-price-row">
            <span className="detail-price">¥{book.currentPrice.toFixed(2)}</span>
            <span className="detail-original-price">原价 ¥{book.originalPrice.toFixed(2)}</span>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>
            {book.description}
          </p>
          <div className="detail-seller">
            <div className="seller-avatar">{book.seller.username[0]}</div>
            <div className="seller-info">
              <div className="seller-name">{book.seller.username}</div>
              <div className="seller-rating">
            <span className="timeline-rating" style={{ color: '#F59E0B' }}>{renderStars(book.seller.rating)}</span>
            <span style={{ marginLeft: '8px', color: '#64748B' }}>{book.seller.rating > 0 ? `${book.seller.rating.toFixed(1)} 分` : '暂无评分'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">📜 教材流转历史</h2>
          <div className="timeline">
            {book.circulationHistory.map(record => (
              <div key={record.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-time">{record.time}</div>
                  <div className="timeline-users">
                    <span className="timeline-user">{record.fromUser}</span>
                    <span className="timeline-arrow">→</span>
                    <span className="timeline-user">{record.toUser}</span>
                  </div>
                  {record.rating > 0 && (
                    <div className="timeline-rating">{renderStars(record.rating)}</div>
                  )}
                  {record.comment && (
                    <>
                      <button
                        className="timeline-toggle"
                        onClick={() => toggleComment(record.id)}
                      >
                        {expandedComments.has(record.id) ? '收起评价 ▲' : '查看评价 ▼'}
                      </button>
                      <div className={`timeline-comment ${expandedComments.has(record.id) ? 'expanded' : ''}`}>
                        {record.comment}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-sidebar">
        <div className="card">
          <h2 className="section-title">💬 联系卖家</h2>
          <div className="message-form">
            <textarea
              className="message-input"
              placeholder="给卖家发送消息，询问书本详情或约定交易时间地点..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              style={{ opacity: sending || !message.trim() ? 0.6 : 1 }}
            >
              {sending ? '发送中...' : '发送消息'}
            </button>
          </div>
        </div>
        <div className="circulation-count">
          <div>
            <div className="circulation-number">{book.circulationCount}</div>
          </div>
          <div className="circulation-label">
            次流转<br />
            教材循环利用
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
