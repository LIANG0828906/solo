import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import type { Book, BookCategory, Promotion } from './types';
import { formatCurrency, getRandomCoverColor, generateId, validatePromoCode } from './utils';

interface BooksModuleProps {
  books: Book[];
  promotions: Promotion[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: BookCategory[] = ['文学', '科技', '生活', '教育'];

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  price: string;
  stock: string;
  category: BookCategory;
}

const emptyForm: BookFormData = {
  title: '',
  author: '',
  isbn: '',
  price: '',
  stock: '',
  category: '文学'
};

interface BookCardProps {
  book: Book;
  isRemoving: boolean;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
}

const BookCard = memo(function BookCard({ book, isRemoving, onEdit, onDelete }: BookCardProps) {
  return (
    <div
      className={`book-card ${isRemoving ? 'removing' : ''}`}
      style={{
        transitionDuration: '300ms',
        transitionProperty: 'transform, opacity',
        transitionTimingFunction: 'ease-in-out'
      }}
    >
      <div
        className="book-cover"
        style={{ backgroundColor: book.coverColor }}
      >
        {book.title}
      </div>
      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
        <span className="book-category">{book.category}</span>
        <div className="book-meta">
          <div className="book-price">{formatCurrency(book.price)}</div>
          <div className="book-stock">库存：{book.stock}</div>
        </div>
      </div>
      <div className="book-actions">
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={() => onEdit(book)}
        >
          编辑
        </button>
        <button
          className="btn btn-danger btn-sm"
          style={{ flex: 1 }}
          onClick={() => onDelete(book.id)}
        >
          删除
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.book === nextProps.book &&
    prevProps.isRemoving === nextProps.isRemoving
  );
});

const BooksModule = ({
  books,
  promotions,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onShowToast
}: BooksModuleProps) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [isFading, setIsFading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>(emptyForm);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ valid: boolean; discount: number; message: string } | null>(null);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (filterCategory !== 'all' && book.category !== filterCategory) return false;
      if (filterPriceMin !== '' && book.price < parseFloat(filterPriceMin)) return false;
      if (filterPriceMax !== '' && book.price > parseFloat(filterPriceMax)) return false;
      return true;
    });
  }, [books, filterCategory, filterPriceMin, filterPriceMax]);

  useEffect(() => {
    setIsFading(true);
    const timer = setTimeout(() => setIsFading(false), 200);
    return () => clearTimeout(timer);
  }, [filterCategory, filterPriceMin, filterPriceMax]);

  const handleDelete = (id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      onDeleteBook(id);
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onShowToast('书籍已删除', 'success');
    }, 300);
  };

  const handleEdit = useCallback((book: Book) => {
    openEditModal(book);
  }, []);

  const handleCardDelete = useCallback((id: string) => {
    handleDelete(id);
  }, []);

  const openAddModal = () => {
    setEditingBook(null);
    setFormData(emptyForm);
    setPromoApplied(null);
    setPromoCode('');
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      price: book.price.toString(),
      stock: book.stock.toString(),
      category: book.category
    });
    setPromoApplied(null);
    setPromoCode('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setFormData(emptyForm);
    setPromoApplied(null);
    setPromoCode('');
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return '请输入书名';
    if (!formData.author.trim()) return '请输入作者';
    if (!formData.isbn.trim()) return '请输入ISBN编号';
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) return '请输入有效的价格';
    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) return '请输入有效的库存量';
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      onShowToast(error, 'error');
      return;
    }

    const bookData: Book = {
      id: editingBook ? editingBook.id : generateId(),
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      category: formData.category,
      coverColor: editingBook ? editingBook.coverColor : getRandomCoverColor(),
      createdAt: editingBook ? editingBook.createdAt : Date.now()
    };

    if (editingBook) {
      onUpdateBook(bookData);
      onShowToast('书籍信息已更新', 'success');
    } else {
      onAddBook(bookData);
      onShowToast('书籍已添加', 'success');
    }
    closeModal();
  };

  const handleTestPromo = () => {
    const sampleTotal = parseFloat(formData.price) * (parseInt(formData.stock, 10) || 1);
    const result = validatePromoCode(promoCode.trim().toUpperCase(), sampleTotal, promotions);
    setPromoApplied({ valid: result.valid, discount: result.discountAmount, message: result.message });
    onShowToast(result.message, result.valid ? 'success' : 'error');
  };

  return (
    <div className="module">
      <div className="section-header">
        <h2 className="section-title">书籍管理（共 {books.length} 本）</h2>
        <button className="btn" onClick={openAddModal}>+ 添加书籍</button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label className="filter-label">分类筛选</label>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">全部分类</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">最低价格</label>
          <input
            type="number"
            className="form-input"
            placeholder="¥0"
            value={filterPriceMin}
            onChange={(e) => setFilterPriceMin(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">最高价格</label>
          <input
            type="number"
            className="form-input"
            placeholder="不限"
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">暂无书籍，点击右上角按钮添加</div>
        </div>
      ) : (
        <div className={`books-grid ${isFading ? 'fading' : ''}`}>
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              isRemoving={removingIds.has(book.id)}
              onEdit={handleEdit}
              onDelete={handleCardDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingBook ? '编辑书籍' : '添加书籍'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">书名</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入书名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">作者</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="请输入作者"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN编号</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="请输入ISBN"
                />
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as BookCategory })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">价格（元）</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">库存量</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="promo-apply-section" style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">测试折扣码（可选）</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入折扣码"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleTestPromo}>
                    校验
                  </button>
                </div>
              </div>
            </div>
            {promoApplied && (
              <div style={{
                marginTop: '8px',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                background: promoApplied.valid ? '#D4EDDA' : '#F8D7DA',
                color: promoApplied.valid ? '#155724' : '#721C24'
              }}>
                {promoApplied.message}
                {promoApplied.valid && promoApplied.discount > 0 && `，减免 ${formatCurrency(promoApplied.discount)}`}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>取消</button>
              <button className="btn" onClick={handleSubmit}>
                {editingBook ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksModule;
