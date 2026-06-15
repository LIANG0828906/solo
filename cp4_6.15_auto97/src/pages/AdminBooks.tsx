import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { addBook, updateBook, deleteBook } from '@/api';
import type { Book } from '@/types';

const emptyBook: Omit<Book, 'id' | 'createdAt'> = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  price: 0,
  stock: 0,
  coverUrl: '',
  description: '',
  category: '文学',
};

const categories = ['文学', '科技', '历史', '艺术', '经济', '心理'];

export default function AdminBooks() {
  const navigate = useNavigate();
  const { books, fetchBooks } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Omit<Book, 'id' | 'createdAt'>>(emptyBook);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks().finally(() => setLoading(false));
  }, [fetchBooks]);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.isbn.includes(query)
    );
  }, [books, searchQuery]);

  const openAddModal = () => {
    setEditingBook(null);
    setFormData(emptyBook);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      price: book.price,
      stock: book.stock,
      coverUrl: book.coverUrl,
      description: book.description,
      category: book.category,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setFormError('请输入书名');
      return;
    }
    if (!formData.author.trim()) {
      setFormError('请输入作者');
      return;
    }
    if (formData.price < 0) {
      setFormError('价格不能为负数');
      return;
    }
    if (formData.stock < 0) {
      setFormError('库存不能为负数');
      return;
    }

    if (editingBook) {
      const response = await updateBook(editingBook.id, formData);
      if (response.success) {
        await fetchBooks();
        setShowModal(false);
      } else {
        setFormError(response.error || '更新失败');
      }
    } else {
      const response = await addBook(formData);
      if (response.success) {
        await fetchBooks();
        setShowModal(false);
      } else {
        setFormError(response.error || '添加失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这本书吗？')) return;
    setDeletingId(id);
    const response = await deleteBook(id);
    if (response.success) {
      await fetchBooks();
    }
    setDeletingId(null);
  };

  const getStockBadgeClass = (stock: number) => {
    if (stock > 10) return 'green';
    if (stock > 0) return 'yellow';
    return 'red';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">图书管理</h1>
        <p className="page-subtitle">管理书店图书库存</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/admin/dashboard')}>
          <i className="fas fa-chart-bar"></i> 数据看板
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/admin/borrows')}>
          <i className="fas fa-clipboard-list"></i> 借阅管理
        </button>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="fas fa-plus"></i> 添加图书
        </button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div className="search-container" style={{ marginBottom: 0, flex: 1, maxWidth: '400px' }}>
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="搜索书名、作者或ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)' }}></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-light)' }}>
            <i className="fas fa-book" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
            <p>暂无图书数据</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>图书</th>
                <th>分类</th>
                <th>价格</th>
                <th>库存</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id} className={deletingId === book.id ? 'book-close-animation' : ''}>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div>
                        <p style={{ fontWeight: '600', color: 'var(--color-text)' }}>{book.title}</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td>{book.category}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: '600' }}>¥{book.price.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={`stock-badge ${getStockBadgeClass(book.stock)}`} style={{ position: 'static' }}></div>
                      <span>{book.stock} 本</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => openEditModal(book)}
                      >
                        <i className="fas fa-edit"></i> 编辑
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '12px', background: '#F44336', color: 'white' }}
                        onClick={() => handleDelete(book.id)}
                        disabled={deletingId === book.id}
                      >
                        <i className="fas fa-trash"></i> 删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px',
        }} onClick={() => setShowModal(false)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)' }}>
                {editingBook ? '编辑图书' : '添加图书'}
              </h2>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              {formError && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(244, 67, 54, 0.1)',
                  color: '#F44336',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                }}>
                  {formError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">书名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入书名"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">作者 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="请输入作者"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ISBN</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="请输入ISBN"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">出版社</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="请输入出版社"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">分类</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">价格 (元) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">库存数量 *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">封面图片URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="请输入封面图片链接"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">图书简介</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入图书简介"
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  {editingBook ? '保存修改' : '添加图书'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
