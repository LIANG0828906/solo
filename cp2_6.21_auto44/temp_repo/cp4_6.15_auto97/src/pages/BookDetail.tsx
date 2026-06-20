import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBook } from '@/api';
import type { Book } from '@/types';
import { useStore } from '@/store';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleCart } = useStore();

  useEffect(() => {
    if (id) {
      loadBook();
    }
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    const response = await fetchBook(id!);
    if (response.success && response.data) {
      setBook(response.data);
    }
    setLoading(false);
  };

  const getStockBadgeClass = (stock: number) => {
    if (stock > 10) return 'green';
    if (stock > 0) return 'yellow';
    return 'red';
  };

  const getStockText = (stock: number) => {
    if (stock > 10) return '库存充足';
    if (stock > 0) return `仅剩 ${stock} 本`;
    return '暂时缺货';
  };

  const handleAddToCart = () => {
    if (book && book.stock > 0) {
      addToCart(book);
      toggleCart(true);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '200px', height: '300px', margin: '0 auto 24px' }}></div>
          <div className="skeleton" style={{ width: '300px', height: '32px', margin: '0 auto 16px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '24px', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>图书不存在</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        className="btn btn-outline" 
        style={{ marginBottom: '24px' }}
        onClick={() => navigate(-1)}
      >
        <i className="fas fa-arrow-left"></i> 返回
      </button>

      <div className="book-detail-enter" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr', 
        gap: '48px',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ position: 'relative' }}>
          <div className={`stock-badge ${getStockBadgeClass(book.stock)}`} style={{ position: 'absolute', top: '16px', left: '16px', width: '16px', height: '16px' }}></div>
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            style={{ 
              width: '100%', 
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
            loading="lazy"
          />
        </div>

        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text)' }}>
            {book.title}
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-light)', marginBottom: '24px' }}>
            {book.author}
          </p>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            marginBottom: '24px',
            padding: '16px',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-md)',
          }}>
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-primary)' }}>
              ¥{book.price.toFixed(2)}
            </span>
            <span className={`status-badge ${book.stock > 10 ? 'borrowed' : book.stock > 0 ? 'overdue' : 'returned'}`}>
              {getStockText(book.stock)}
            </span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginBottom: '32px',
            padding: '24px 0',
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '4px' }}>出版社</p>
              <p style={{ fontWeight: '500' }}>{book.publisher}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '4px' }}>ISBN</p>
              <p style={{ fontWeight: '500' }}>{book.isbn}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '4px' }}>分类</p>
              <p style={{ fontWeight: '500' }}>{book.category}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '4px' }}>库存</p>
              <p style={{ fontWeight: '500' }}>{book.stock} 本</p>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text)' }}>
              内容简介
            </h3>
            <p style={{ 
              color: 'var(--color-text-light)', 
              lineHeight: '1.8',
              fontSize: '16px',
            }}>
              {book.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <i className="fas fa-cart-plus"></i> 加入购物车
            </button>
            <button 
              className="btn btn-accent"
              onClick={handleAddToCart}
              disabled={book.stock === 0}
            >
              <i className="fas fa-bolt"></i> 立即购买
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
