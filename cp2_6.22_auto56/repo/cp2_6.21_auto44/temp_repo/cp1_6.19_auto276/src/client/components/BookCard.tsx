import { useEffect, useRef, useState } from 'react';
import { Book, useAppStore, api } from '../store';

interface BookCardProps {
  book: Book;
  onExchange?: (book: Book) => void;
}

const BookCard = ({ book, onExchange }: BookCardProps) => {
  const user = useAppStore((s) => s.user);
  const updateBook = useAppStore((s) => s.updateBook);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [book.cover_url]);

  const handleExchange = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/books/${book.id}/exchange`);
      const updatedBook = { ...book, status: 'exchanging' as const };
      updateBook(updatedBook);
      setShowModal(false);
      alert(res.data.message);
      onExchange?.(updatedBook);
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = book.status === 'exchanging' ? 'status-exchanging' : book.status === 'completed' ? 'status-completed' : '';
  const isOwn = user && user.id === book.user_id;

  return (
    <div className={`book-card ${statusClass}`}>
      {book.status === 'completed' && <span className="status-label completed">已完成</span>}
      {book.cover_url ? (
        <img
          ref={imgRef}
          data-src={book.cover_url}
          alt={book.title}
          className="book-cover"
          style={{ background: '#f5f6fa' }}
        />
      ) : (
        <div className="book-cover-placeholder">📚</div>
      )}
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <span className="book-subject">{book.subject}</span>
          <span className="book-price">¥{book.price}</span>
        </div>
        {book.status === 'available' && !isOwn ? (
          <button
            className="card-btn btn btn-accent"
            onClick={() => setShowModal(true)}
          >
            申请交换
          </button>
        ) : book.status === 'exchanging' ? (
          <button className="card-btn btn" style={{ background: '#F5E6D3', color: '#E67E22' }} disabled>
            交换中
          </button>
        ) : book.status === 'completed' ? (
          <button className="card-btn btn btn-success" disabled>
            已完成
          </button>
        ) : isOwn ? (
          <button className="card-btn btn btn-ghost" disabled>
            我的教材
          </button>
        ) : null}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">确认申请交换</h2>
            <p style={{ marginBottom: 16, color: '#555' }}>
              您确定要申请交换《<strong>{book.title}</strong>》吗？
            </p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              提交申请后，请等待对方同意。交换期间该教材将被锁定。
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className="btn btn-accent" onClick={handleExchange} disabled={loading}>
                {loading ? '提交中...' : '确认申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;
