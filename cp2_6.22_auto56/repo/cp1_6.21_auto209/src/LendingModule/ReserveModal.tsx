import React, { useState, useEffect, useCallback } from 'react';
import type { Book } from '../types';
import { useLending } from './LendingContext';
import { truncateText } from '../utils/helpers';

interface ReserveModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReserveModal({ book, isOpen, onClose }: ReserveModalProps) {
  const { reserveBook, currentUser, records } = useLending();
  const [isReserving, setIsReserving] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasExistingRecord = book
    ? records.some(
        r =>
          r.bookId === book.id &&
          (r.status === 'reserved' || r.status === 'borrowed')
      )
    : false;

  const resetState = useCallback(() => {
    setIsReserving(false);
    setIsReserved(false);
    setShowSuccess(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReserve = async () => {
    if (!book || isReserving || isReserved || hasExistingRecord) return;

    setIsReserving(true);
    const result = await reserveBook(book.id);
    setIsReserving(false);

    if (result) {
      setIsReserved(true);
      setShowSuccess(true);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !book) return null;

  const buttonText = () => {
    if (hasExistingRecord) return '已预约/借阅';
    if (isReserved) return '已预约';
    if (isReserving) return '预约中...';
    return '立即预约';
  };

  const isButtonDisabled = isReserving || isReserved || hasExistingRecord;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          animation: 'slideUp 0.3s ease-out',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#334155',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
          aria-label="关闭"
        >
          ✕
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              width: '160px',
              height: '240px',
              backgroundColor: book.coverColor || '#334155',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '2px',
              }}
            >
              BOOK
            </div>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '12px',
                right: '12px',
                textAlign: 'center',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {book.category}
            </div>
          </div>

          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#F8FAFC',
                marginBottom: '8px',
                lineHeight: 1.3,
              }}
            >
              {book.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '12px' }}>
              作者：{book.author}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  backgroundColor: book.status === 'available' ? '#22C55E' : '#EF4444',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {book.status === 'available' ? '可借' : '已借出'}
              </span>
              <span
                style={{
                  backgroundColor: '#334155',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {book.category}
              </span>
              <span
                style={{
                  backgroundColor: '#334155',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                库存：{book.availableCopies}/{book.totalCopies}
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#0F172A',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  marginBottom: '4px',
                }}
              >
                ISBN
              </div>
              <div style={{ fontSize: '14px', color: '#F8FAFC', fontFamily: 'monospace' }}>
                {book.isbn || '-'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                内容简介
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#94A3B8',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {truncateText(book.description, 200)}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                fontSize: '13px',
                color: '#64748B',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ color: '#94A3B8' }}>出版年份：</span>
                {book.publishYear}年
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>页数：</span>
                {book.pages}页
              </div>
            </div>
          </div>

          <button
            onClick={handleReserve}
            disabled={isButtonDisabled}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              border: 'none',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              background: showSuccess
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              transition:
                'background 0.5s ease, filter 0.2s ease, transform 0.2s ease',
              filter: showSuccess ? 'none' : 'brightness(1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              minHeight: '48px',
              opacity: isButtonDisabled && !showSuccess ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!isButtonDisabled) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.filter = showSuccess ? 'none' : 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isReserving && <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />}
            {showSuccess && (
              <svg className="checkmark-svg" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {buttonText()}
          </button>

          {!currentUser && (
            <p style={{ fontSize: '12px', color: '#EF4444', textAlign: 'center' }}>
              请先登录后再进行预约操作
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
