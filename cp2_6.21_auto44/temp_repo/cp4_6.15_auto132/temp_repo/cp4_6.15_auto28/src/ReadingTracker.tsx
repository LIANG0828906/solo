import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { BookStorage } from './BookStorage';
import type { Book, ReadingRecord } from './types';
import { getReadingProgress, formatDate } from './utils';

const ReadingTracker: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshBooks, showToast } = useApp();

  const [book, setBook] = useState<Book | null>(null);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const [formData, setFormData] = useState({
    startPage: '',
    endPage: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      const bookData = BookStorage.getBook(id);
      if (bookData) {
        setBook(bookData);
        setFormData(prev => ({
          ...prev,
          startPage: bookData.currentPage.toString(),
          endPage: bookData.currentPage.toString()
        }));
        setRecords(BookStorage.getReadingRecords(id));

        setTimeout(() => {
          setAnimatedProgress(getReadingProgress(bookData.currentPage, bookData.totalPages));
        }, 100);
      } else {
        showToast('图书不存在', 'error');
        navigate('/');
      }
    }
  }, [id, navigate, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const start = parseInt(formData.startPage);
    const end = parseInt(formData.endPage);
    const dur = parseInt(formData.duration);

    if (!formData.startPage || start < 0) {
      newErrors.startPage = '请输入有效的起始页码';
    }
    if (!formData.endPage || end < 0) {
      newErrors.endPage = '请输入有效的结束页码';
    }
    if (start > end) {
      newErrors.endPage = '结束页码不能小于起始页码';
    }
    if (book && end > book.totalPages) {
      newErrors.endPage = `结束页码不能超过总页数 ${book.totalPages}`;
    }
    if (!formData.duration || dur <= 0) {
      newErrors.duration = '请输入有效的阅读时长';
    }
    if (!formData.date) {
      newErrors.date = '请选择阅读日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !id) {
      showToast('请检查表单填写是否正确', 'error');
      return;
    }

    const start = parseInt(formData.startPage);
    const end = parseInt(formData.endPage);
    const dur = parseInt(formData.duration);

    BookStorage.addReadingRecord({
      bookId: id,
      startPage: start,
      endPage: end,
      duration: dur,
      date: formData.date,
      notes: formData.notes.trim()
    });

    const updatedBook = BookStorage.getBook(id);
    if (updatedBook) {
      setBook(updatedBook);
      setRecords(BookStorage.getReadingRecords(id));
      setAnimatedProgress(0);
      setTimeout(() => {
        setAnimatedProgress(getReadingProgress(updatedBook.currentPage, updatedBook.totalPages));
      }, 50);
    }

    refreshBooks();
    showToast('阅读记录已添加！');

    setFormData(prev => ({
      ...prev,
      startPage: end.toString(),
      endPage: end.toString(),
      duration: '',
      notes: ''
    }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      navigate('/');
    }, 280);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal ${isClosing ? 'closing' : ''}`}
        style={{ maxWidth: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">记录阅读进度</h2>
          <button className="modal-close" onClick={handleClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {book && (
          <>
            <div className="modal-body">
              <div style={{ 
                display: 'flex', 
                gap: 20, 
                marginBottom: 24,
                padding: 16,
                background: 'var(--color-bg-alt)',
                borderRadius: 8
              }}>
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <div style={{
                    width: 80, 
                    height: 110, 
                    background: 'var(--color-border)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    color: 'var(--color-primary-light)'
                  }}>
                    {book.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 4 }}>
                    {book.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: 14, marginBottom: 8 }}>
                    {book.author}
                  </p>
                  <div className="progress-container" style={{ marginBottom: 0 }}>
                    <div className="progress-header">
                      <span className="progress-label">阅读进度</span>
                      <span className="progress-value">{animatedProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${animatedProgress}%` }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
                      {book.currentPage} / {book.totalPages} 页
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <h4 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: 16, 
                  marginBottom: 16,
                  color: 'var(--color-text)'
                }}>
                  添加阅读记录
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">起始页码</label>
                    <input
                      type="number"
                      name="startPage"
                      className="form-input"
                      value={formData.startPage}
                      onChange={handleChange}
                      min="0"
                    />
                    {errors.startPage && <div className="form-error">{errors.startPage}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">结束页码</label>
                    <input
                      type="number"
                      name="endPage"
                      className="form-input"
                      value={formData.endPage}
                      onChange={handleChange}
                      min="0"
                    />
                    {errors.endPage && <div className="form-error">{errors.endPage}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">阅读时长（分钟）</label>
                    <input
                      type="number"
                      name="duration"
                      className="form-input"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="30"
                      min="1"
                    />
                    {errors.duration && <div className="form-error">{errors.duration}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">阅读日期</label>
                    <input
                      type="date"
                      name="date"
                      className="form-input"
                      value={formData.date}
                      onChange={handleChange}
                    />
                    {errors.date && <div className="form-error">{errors.date}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">阅读笔记</label>
                  <textarea
                    name="notes"
                    className="form-textarea"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="记录一下今天的阅读感悟..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    返回
                  </button>
                  <button type="submit" className="btn btn-primary">
                    保存记录
                  </button>
                </div>
              </form>

              {records.length > 0 && (
                <div className="record-list">
                  <h4 style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: 16, 
                    marginBottom: 16,
                    color: 'var(--color-text)'
                  }}>
                    阅读历史 ({records.length} 条)
                  </h4>
                  {records.map(record => (
                    <div key={record.id} className="record-item">
                      <div className="record-header">
                        <span className="record-date">{formatDate(record.date)}</span>
                        <span className="record-pages">
                          第 {record.startPage} - {record.endPage} 页
                        </span>
                      </div>
                      <div className="record-details">
                        <span>📖 阅读 {record.endPage - record.startPage + 1} 页</span>
                        <span>⏱ 用时 {record.duration} 分钟</span>
                      </div>
                      {record.notes && (
                        <p className="record-notes">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReadingTracker;
