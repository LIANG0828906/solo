import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { bookApi } from '../services/api';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, updateBookStatus, addToast, setLoading } = useAppStore();
  const [borrowerName, setBorrowerName] = useState('');
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);

  const book = books.find((b) => b.id === Number(id));

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ marginBottom: '16px', color: '#888' }}>未找到该书籍</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            background: '#8e44ad',
            color: '#fff',
          }}
        >
          返回书架
        </button>
      </div>
    );
  }

  const handleBorrow = async () => {
    if (!borrowerName.trim()) {
      addToast('请输入借阅人姓名', 'warning');
      return;
    }
    setLoading(true);
    try {
      await bookApi.updateStatus(book.id, 'borrowed', borrowerName.trim());
      updateBookStatus(book.id, 'borrowed', borrowerName.trim());
      addToast(`《${book.title}》已成功借出`, 'success');
      setShowBorrowDialog(false);
      setBorrowerName('');
    } catch (error) {
      addToast('借出失败，请重试', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    setLoading(true);
    try {
      await bookApi.updateStatus(book.id, 'available');
      updateBookStatus(book.id, 'available');
      addToast(`《${book.title}》已成功归还`, 'success');
    } catch (error) {
      addToast('归还失败，请重试', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '24px',
          background: 'none',
          color: '#8e44ad',
          fontSize: '14px',
          padding: '4px 0',
        }}
      >
        ← 返回书架
      </button>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '32px',
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: '300px',
            height: '450px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#f0ede8',
          }}
        >
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '280px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            {book.title}
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
            作者：{book.author}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {book.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  background: '#f5f0fa',
                  color: '#8e44ad',
                  fontSize: '13px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
            <span style={{ color: '#f1c40f', fontSize: '18px' }}>
              {'★'.repeat(Math.floor(book.rating))}
              {'☆'.repeat(5 - Math.floor(book.rating))}
            </span>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#fff',
                background: book.status === 'available' ? '#27ae60' : '#e67e22',
              }}
            >
              {book.status === 'available' ? '在架可借' : `已被 ${book.borrower || '他人'} 借出`}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
            内容简介
          </h3>
          <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#555', marginBottom: '32px' }}>
            {book.description.length > 300
              ? book.description.substring(0, 300) + '...'
              : book.description}
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            {book.status === 'available' ? (
              <button
                onClick={() => setShowBorrowDialog(true)}
                style={{
                  padding: '12px 32px',
                  borderRadius: '8px',
                  background: '#8e44ad',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease-out',
                }}
              >
                借出此书
              </button>
            ) : (
              <button
                onClick={handleReturn}
                style={{
                  padding: '12px 32px',
                  borderRadius: '8px',
                  background: '#27ae60',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease-out',
                }}
              >
                归还此书
              </button>
            )}
          </div>
        </div>
      </div>

      {showBorrowDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowBorrowDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#333' }}>
              确认借出《{book.title}》
            </h3>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#555' }}>
              请输入借阅人姓名：
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="借阅人姓名"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                marginBottom: '24px',
                transition: 'border-color 0.3s ease-out',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8e44ad')}
              onBlur={(e) => (e.target.style.borderColor = '#ddd')}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBorrowDialog(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#f0ede8',
                  color: '#555',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleBorrow}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#8e44ad',
                  color: '#fff',
                  fontSize: '14px',
                }}
              >
                确认借出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;
