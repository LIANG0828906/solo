import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppStore, Book, api } from '../store';
import BookCard from '../components/BookCard';

const SUBJECTS = ['数学', '物理', '化学', '计算机', '文学', '语言', '历史', '哲学'];

const ExchangePage = () => {
  const { books, fetchBooks, myBooks, fetchMyBooks, addBook, user } = useAppStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [maxPrice, setMaxPrice] = useState(200);
  const [sortBy, setSortBy] = useState<'price' | 'title'>('price');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', author: '', subject: '数学', price: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchRef.current), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchBooks();
    if (user) fetchMyBooks();
  }, [fetchBooks, fetchMyBooks, user]);

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (subject) {
      result = result.filter((b) => b.subject === subject);
    }
    result = result.filter((b) => b.price <= maxPrice);
    if (sortBy === 'price') {
      result.sort((a, b) => a.price - b.price);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [books, debouncedSearch, subject, maxPrice, sortBy]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('author', uploadForm.author);
      formData.append('subject', uploadForm.subject);
      formData.append('price', uploadForm.price);
      if (coverFile) formData.append('cover', coverFile);
      const res = await api.post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addBook(res.data);
      setShowUpload(false);
      setUploadForm({ title: '', author: '', subject: '数学', price: '' });
      setCoverFile(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'exchanging') return <span className="status-exchanging-text">交换中</span>;
    if (status === 'completed') return <span className="status-completed-text">已完成</span>;
    return <span className="status-available-text">可交换</span>;
  };

  return (
    <div className="page">
      <h1 className="page-title">教材交换</h1>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="搜索书名或作者..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">全部科目</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="sort-buttons">
          <button className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`} onClick={() => setSortBy('price')}>
            按价格
          </button>
          <button className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`} onClick={() => setSortBy('title')}>
            按书名
          </button>
        </div>
        <button className="btn btn-accent" onClick={() => setShowUpload(true)}>
          + 上传教材
        </button>
      </div>

      <div className="layout">
        <div>
          {filteredBooks.length === 0 ? (
            <div className="empty-state">暂无符合条件的教材</div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">价格区间</h3>
            <div className="filter-group">
              <input
                type="range"
                className="price-slider"
                min="0"
                max="200"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
              <div className="price-range">
                <span>¥0</span>
                <span>¥{maxPrice}</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="sidebar-card">
              <h3 className="sidebar-title">我的教材</h3>
              {myBooks.length === 0 ? (
                <p style={{ fontSize: 13, color: '#999' }}>暂无上架教材</p>
              ) : (
                <div className="my-books-list">
                  {myBooks.slice(0, 8).map((book) => (
                    <div key={book.id} className="my-book-item">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt="" className="my-book-thumb" />
                      ) : (
                        <div className="my-book-thumb" />
                      )}
                      <div className="my-book-info">
                        <div className="my-book-title">{book.title}</div>
                        <div className="my-book-status">{renderStatus(book.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">上传教材</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">书名</label>
                <input
                  className="form-input"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="请输入书名"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">作者</label>
                <input
                  className="form-input"
                  value={uploadForm.author}
                  onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                  placeholder="请输入作者"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">科目</label>
                <select
                  className="form-input"
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">交换价（元）</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={uploadForm.price}
                  onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                  placeholder="请输入价格"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">封面图片（可选）</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowUpload(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-accent" disabled={uploading}>
                  {uploading ? '上传中...' : '确认上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangePage;
