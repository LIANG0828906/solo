import { useState, useMemo } from 'react';
import type { Book } from '@shared/types';
import { createBook, updateBook, deleteBook } from '../services/api';

interface InventoryPanelProps {
  books: Book[];
  isCustomerView: boolean;
  onAddToCart?: (book: Book) => void;
  onRefresh: () => void;
}

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

interface FormData {
  title: string;
  author: string;
  isbn: string;
  price: string;
  stock: string;
  coverUrl: string;
}

const emptyForm: FormData = {
  title: '',
  author: '',
  isbn: '',
  price: '',
  stock: '',
  coverUrl: '',
};

export function InventoryPanel({ books, isCustomerView, onAddToCart, onRefresh }: InventoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredBooks = useMemo(() => {
    let result = books.slice();

    if (isCustomerView) {
      result = result.filter((b) => b.isActive && b.stock > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    const active = result.filter((b) => b.isActive);
    const inactive = result.filter((b) => !b.isActive);

    const sortFn = (a: Book, b: Book) => {
      switch (sortKey) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        default:
          return 0;
      }
    };

    return [...active.sort(sortFn), ...inactive.sort(sortFn)];
  }, [books, searchQuery, sortKey, isCustomerView]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        coverUrl: formData.coverUrl,
        isActive: true,
      };

      if (editingId) {
        await updateBook(editingId, payload);
      } else {
        await createBook(payload);
      }

      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Save book failed:', err);
    }
  };

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      price: book.price.toString(),
      stock: book.stock.toString(),
      coverUrl: book.coverUrl,
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此书？')) return;
    try {
      await deleteBook(id);
      onRefresh();
    } catch (err) {
      console.error('Delete book failed:', err);
    }
  };

  const handleToggleActive = async (book: Book) => {
    try {
      await updateBook(book.id, { isActive: !book.isActive });
      onRefresh();
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.toolbar}>
          <h2 style={styles.title}>{isCustomerView ? '图书选购' : '库存管理'}</h2>
          {!isCustomerView && (
            <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
              {showForm ? '收起表单' : '+ 上架新书'}
            </button>
          )}
        </div>

        {showForm && !isCustomerView && (
          <form style={styles.form} onSubmit={handleSubmit}>
            <h3 style={styles.formTitle}>{editingId ? '编辑图书' : '上架新书'}</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="书名"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="作者"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder="ISBN"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="number"
                step="0.01"
                placeholder="定价(元)"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
                min="0"
              />
              <input
                style={styles.input}
                type="number"
                placeholder="库存量"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                required
                min="0"
              />
              <input
                style={styles.input}
                placeholder="封面URL"
                value={formData.coverUrl}
                onChange={(e) => handleInputChange('coverUrl', e.target.value)}
              />
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryBtn}>
                {editingId ? '保存修改' : '确认上架'}
              </button>
              <button type="button" style={styles.secondaryBtn} onClick={resetForm}>
                取消
              </button>
            </div>
          </form>
        )}

        <div style={styles.filterBar}>
          <input
            style={styles.searchInput}
            placeholder="搜索书名或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            style={styles.select}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="default">默认排序</option>
            <option value="price-asc">价格从低到高</option>
            <option value="price-desc">价格从高到低</option>
            <option value="stock-asc">库存从少到多</option>
            <option value="stock-desc">库存从多到少</option>
          </select>
        </div>

        <div style={styles.grid}>
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              style={{
                ...styles.card,
                ...(book.isActive ? {} : styles.cardInactive),
              }}
            >
              <div style={styles.coverWrap}>
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} style={styles.cover} />
                ) : (
                  <div style={styles.coverPlaceholder}>
                    <span style={{ fontSize: 36 }}>📚</span>
                  </div>
                )}
              </div>
              <div style={styles.cardBody}>
                <h4 style={styles.bookTitle} title={book.title}>
                  {book.title}
                </h4>
                <p style={styles.bookAuthor}>{book.author}</p>
                <div style={styles.cardInfo}>
                  <span style={styles.price}>¥{book.price.toFixed(2)}</span>
                  <span style={styles.stockBadge(book.stock)}>库存: {book.stock}</span>
                </div>
                {!book.isActive && !isCustomerView && (
                  <div style={styles.inactiveLabel}>已下架</div>
                )}
                <div style={styles.cardActions}>
                  {isCustomerView ? (
                    <button
                      style={styles.primaryBtn}
                      onClick={() => onAddToCart?.(book)}
                      disabled={book.stock <= 0}
                    >
                      加入购物车
                    </button>
                  ) : (
                    <>
                      <button style={styles.secondaryBtn} onClick={() => handleEdit(book)}>
                        编辑
                      </button>
                      <button
                        style={styles.secondaryBtn}
                        onClick={() => handleToggleActive(book)}
                      >
                        {book.isActive ? '下架' : '上架'}
                      </button>
                      <button style={styles.dangerBtn} onClick={() => handleDelete(book.id)}>
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div style={styles.empty}>暂无图书数据</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    gap: 20,
  } as React.CSSProperties,
  mainContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  } as React.CSSProperties,
  title: {
    fontSize: 22,
    color: '#5D4037',
    fontWeight: 600,
  } as React.CSSProperties,
  primaryBtn: {
    padding: '8px 18px',
    backgroundColor: '#D84315',
    color: '#FFF8E1',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  secondaryBtn: {
    padding: '6px 14px',
    backgroundColor: '#FFE0B2',
    color: '#5D4037',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  dangerBtn: {
    padding: '6px 14px',
    backgroundColor: '#FFCCBC',
    color: '#BF360C',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  form: {
    backgroundColor: '#FFFBF5',
    border: '1px solid #FFE0B2',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  } as React.CSSProperties,
  formTitle: {
    fontSize: 16,
    color: '#5D4037',
    marginBottom: 16,
    fontWeight: 600,
  } as React.CSSProperties,
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 16,
  } as React.CSSProperties,
  input: {
    padding: '9px 12px',
    border: '1px solid #FFCC80',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#FFFDF8',
    color: '#3E2723',
    outline: 'none',
  } as React.CSSProperties,
  formActions: {
    display: 'flex',
    gap: 10,
  } as React.CSSProperties,
  filterBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    minWidth: 200,
    padding: '10px 14px',
    border: '1px solid #FFCC80',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#FFFDF8',
    color: '#3E2723',
    outline: 'none',
  } as React.CSSProperties,
  select: {
    padding: '10px 14px',
    border: '1px solid #FFCC80',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#FFFDF8',
    color: '#3E2723',
    cursor: 'pointer',
    outline: 'none',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  } as React.CSSProperties,
  card: {
    backgroundColor: '#FFFDF8',
    border: '1px solid #FFE0B2',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.2s, transform 0.2s',
  } as React.CSSProperties,
  cardInactive: {
    opacity: 0.5,
    filter: 'grayscale(60%)',
  } as React.CSSProperties,
  coverWrap: {
    width: '100%',
    paddingTop: '56.25%',
    position: 'relative' as const,
    backgroundColor: '#FFF3E0',
    overflow: 'hidden',
  } as React.CSSProperties,
  cover: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  coverPlaceholder: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
  } as React.CSSProperties,
  cardBody: {
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  } as React.CSSProperties,
  bookTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#3E2723',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
  bookAuthor: {
    fontSize: 13,
    color: '#8D6E63',
  } as React.CSSProperties,
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  } as React.CSSProperties,
  price: {
    fontSize: 18,
    fontWeight: 700,
    color: '#D84315',
  } as React.CSSProperties,
  stockBadge: (stock: number) => ({
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 4,
    backgroundColor: stock > 5 ? '#E8F5E9' : stock > 0 ? '#FFF8E1' : '#FFEBEE',
    color: stock > 5 ? '#2E7D32' : stock > 0 ? '#F57C00' : '#C62828',
    fontWeight: 500,
  }) as React.CSSProperties,
  inactiveLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center' as const,
    padding: '2px 8px',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    alignSelf: 'flex-start',
  } as React.CSSProperties,
  cardActions: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#A1887F',
    fontSize: 16,
  } as React.CSSProperties,
};
