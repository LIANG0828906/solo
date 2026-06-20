import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addBook, Book } from '../services/api';

interface BookEditorProps {
  onBookAdded: () => void;
}

const categories = ['小说', '科普', '历史', '哲学', '艺术', '其他'] as const;

type CategoryType = (typeof categories)[number];

export default function BookEditor({ onBookAdded }: BookEditorProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<CategoryType>('小说');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      alert('请填写书名和作者');
      return;
    }

    setSubmitting(true);
    try {
      const newBook: Omit<Book, 'id'> = {
        title,
        author,
        category,
        startDate,
        endDate,
        rating,
        review,
      };
      await addBook(newBook);
      onBookAdded();
      navigate('/');
    } catch (error) {
      console.error('添加书籍失败:', error);
      alert('添加书籍失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">添加新书</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">书名 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入书名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">作者 *</label>
            <input
              type="text"
              className="form-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者"
            />
          </div>

          <div className="form-group">
            <label className="form-label">类型</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">开始阅读日期</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">结束阅读日期</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">评分</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">评论</label>
            <textarea
              className="form-textarea"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="写下你的阅读感受..."
            />
          </div>

          <button type="submit" className="form-submit" disabled={submitting}>
            {submitting ? '提交中...' : '添加到书架'}
          </button>
        </form>
      </div>
    </div>
  );
}
