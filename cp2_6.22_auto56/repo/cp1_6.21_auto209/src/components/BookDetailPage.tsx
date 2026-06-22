import React, { useState, useEffect } from 'react';
import type { Book, LendingRecord } from '../types';
import { useLending } from '../LendingModule/LendingContext';
import { formatDate, getDaysRemaining } from '../utils/helpers';

interface BookDetailPageProps {
  book: Book;
  record?: LendingRecord;
  isOpen: boolean;
  onClose: () => void;
  onRenew?: () => void;
  isRenewing?: boolean;
}

export default function BookDetailPage({
  book,
  record,
  isOpen,
  onClose,
  onRenew,
  isRenewing = false,
}: BookDetailPageProps) {
  const { reserveBook, records } = useLending();
  const [isReserving, setIsReserving] = useState(false);
  const [isRenewed, setIsRenewed] = useState(false);
  const [showRenewSuccess, setShowRenewSuccess] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [showReserveSuccess, setShowReserveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsRenewed(false);
      setShowRenewSuccess(false);
      setIsReserved(false);
      setShowReserveSuccess(false);
    }
  }, [isOpen]);

  const daysRemaining = record?.dueDate ? getDaysRemaining(record.dueDate) : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const canRenew =
    record &&
    record.status === 'borrowed' &&
    record.renewCount < 2 &&
    !isOverdue &&
    !isRenewed;

  const hasExistingRecord = records.some(
    (r) =>
      r.bookId === book.id &&
      (r.status === 'reserved' || r.status === 'borrowed')
  );

  const handleRenew = async () => {
    if (!canRenew || isRenewing) return;
    if (onRenew) {
      onRenew();
      setIsRenewed(true);
      setShowRenewSuccess(true);
    }
  };

  const handleReserve = async () => {
    if (isReserving || isReserved || hasExistingRecord) return;
    setIsReserving(true);
    const result = await reserveBook(book.id);
    setIsReserving(false);
    if (result) {
      setIsReserved(true);
      setShowReserveSuccess(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
          border: '1px solid #1E293B',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#0F172A',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            图书详情
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1E293B',
              color: '#94A3B8',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1E293B';
              e.currentTarget.style.color = '#94A3B8';
            }}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '200px',
                height: '300px',
                backgroundColor: book.coverColor || '#334155',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  right: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '3px',
                }}
              >
                {book.category.toUpperCase()}
              </div>
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="1.2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {book.publishYear} · {book.pages}页
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: '12px',
                  lineHeight: 1.2,
                }}
              >
                {book.title}
              </h1>
              <p style={{ fontSize: '16px', color: '#94A3B8', marginBottom: '16px' }}>
                作者：{book.author}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <span
                  style={{
                    backgroundColor: book.status === 'available' ? '#22C55E' : '#EF4444',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {book.status === 'available' ? '可借' : '已借出'}
                </span>
                <span
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#94A3B8',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid #334155',
                  }}
                >
                  {book.category}
                </span>
                <span
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#6366F1',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid #6366F1',
                  }}
                >
                  库存：{book.availableCopies}/{book.totalCopies}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                    ISBN
                  </div>
                  <div style={{ fontSize: '13px', color: '#F8FAFC', fontFamily: 'monospace' }}>
                    {book.isbn || '-'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                    出版年份
                  </div>
                  <div style={{ fontSize: '13px', color: '#F8FAFC' }}>
                    {book.publishYear}年
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#F8FAFC',
                marginBottom: '12px',
              }}
            >
              内容简介
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: '#94A3B8',
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {book.description || '暂无简介'}
            </p>
          </div>

          {record && (
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  marginBottom: '16px',
                }}
              >
                借阅信息
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                    借阅日期
                  </div>
                  <div style={{ fontSize: '14px', color: '#F8FAFC' }}>
                    {formatDate(record.borrowedAt) || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                    应还日期
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: isOverdue ? '#EF4444' : '#F8FAFC',
                      fontWeight: isOverdue ? 600 : 400,
                    }}
                  >
                    {formatDate(record.dueDate) || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                    续借次数
                  </div>
                  <div style={{ fontSize: '14px', color: '#F8FAFC' }}>
                    {record.renewCount} 次（最多 2 次）
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                    剩余天数
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color:
                        isOverdue
                          ? '#EF4444'
                          : daysRemaining !== null && daysRemaining <= 3
                          ? '#F59E0B'
                          : '#22C55E',
                      fontWeight: 600,
                    }}
                  >
                    {daysRemaining !== null
                      ? isOverdue
                        ? `逾期 ${Math.abs(daysRemaining)} 天`
                        : `${daysRemaining} 天`
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #1E293B',
            backgroundColor: '#0F172A',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {canRenew ? (
            <button
              onClick={handleRenew}
              disabled={isRenewing || isRenewed}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #22C55E',
                cursor: isRenewing || isRenewed ? 'not-allowed' : 'pointer',
                backgroundColor: showRenewSuccess ? '#22C55E' : 'transparent',
                color: showRenewSuccess ? 'white' : '#22C55E',
                transition: 'all 0.5s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => {
                if (!isRenewing && !showRenewSuccess) {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!showRenewSuccess) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {(isRenewing && !showRenewSuccess) && (
                <div
                  className="loading-spinner"
                  style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                />
              )}
              {showRenewSuccess && (
                <svg
                  className="checkmark-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  width="18"
                  height="18"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {showRenewSuccess ? '已续借' : isRenewing ? '续借中...' : '续借 +14天'}
            </button>
          ) : null}

          {!record && book.status === 'available' && (
            <button
              onClick={handleReserve}
              disabled={isReserving || isReserved || hasExistingRecord}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor:
                  isReserving || isReserved || hasExistingRecord
                    ? 'not-allowed'
                    : 'pointer',
                background: showReserveSuccess
                  ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white',
                transition: 'all 0.5s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                filter: showReserveSuccess ? 'none' : 'brightness(1)',
              }}
              onMouseOver={(e) => {
                if (!isReserving && !showReserveSuccess && !hasExistingRecord) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = showReserveSuccess ? 'none' : 'brightness(1)';
              }}
            >
              {isReserving && (
                <div
                  className="loading-spinner"
                  style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                />
              )}
              {showReserveSuccess && (
                <svg
                  className="checkmark-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  width="18"
                  height="18"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {hasExistingRecord
                ? '已预约/借阅'
                : showReserveSuccess
                ? '已预约'
                : isReserving
                ? '预约中...'
                : '立即预约'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #334155',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
