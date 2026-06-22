import React, { useState, useEffect } from 'react';
import { useLending } from '../LendingModule/LendingContext';
import { formatDate, getDaysRemaining, getStatusText } from '../utils/helpers';
import BookDetailPage from './BookDetailPage';
import type { Book, LendingRecord } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { records, returnBook, renewBook, isLoading, cancelReservation, currentUser } = useLending();
  const [selectedRecord, setSelectedRecord] = useState<LendingRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'borrowed' | 'reserved' | 'returned'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSelectedRecord(null), 300);
    }
  }, [isOpen]);

  const filteredRecords = records.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime()
  );

  const handleReturn = async (recordId: string) => {
    setActionLoading(recordId);
    await returnBook(recordId);
    setActionLoading(null);
  };

  const handleRenew = async (record: LendingRecord) => {
    setActionLoading(record.id);
    const result = await renewBook(record.id);
    setActionLoading(null);
    if (result) {
      setSelectedRecord(result);
    }
  };

  const handleCancel = async (recordId: string) => {
    setActionLoading(recordId);
    await cancelReservation(recordId);
    setActionLoading(null);
  };

  const handleViewDetail = (record: LendingRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      reserved: { backgroundColor: '#F59E0B', color: 'white' },
      borrowed: { backgroundColor: '#6366F1', color: 'white' },
      returned: { backgroundColor: '#334155', color: '#94A3B8' },
    };
    return styles[status] || styles.returned;
  };

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: records.length },
    { key: 'borrowed', label: '借阅中', count: records.filter(r => r.status === 'borrowed').length },
    { key: 'reserved', label: '预约中', count: records.filter(r => r.status === 'reserved').length },
    { key: 'returned', label: '已归还', count: records.filter(r => r.status === 'returned').length },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            animation: 'fadeIn 0.25s ease-out',
          }}
        />
      )}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: '#111827',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
          boxShadow: isOpen ? '-4px 0 24px rgba(0, 0, 0, 0.3)' : 'none',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              我的借阅
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#1F2937',
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
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1F2937';
              e.currentTarget.style.color = '#94A3B8';
            }}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1F2937',
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === tab.key ? '#6366F1' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#94A3B8',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#1F2937',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
          }}
        >
          {isLoading && sortedRecords.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
              }}
            >
              <div className="loading-spinner" />
            </div>
          ) : sortedRecords.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                >
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                暂无借阅记录
              </p>
              <p style={{ fontSize: '12px', color: '#475569' }}>
                快去图书馆发现好书吧！
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedRecords.map((record) => {
                const book = record.bookSnapshot as Book;
                const daysRemaining = getDaysRemaining(record.dueDate);
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                const isRenewable =
                  record.status === 'borrowed' &&
                  record.renewCount < 2 &&
                  !isOverdue;
                const isActionLoading = actionLoading === record.id;

                return (
                  <div
                    key={record.id}
                    onClick={() => handleViewDetail(record)}
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      animation: 'slideUp 0.3s ease-out',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F2937';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          backgroundColor: book?.coverColor || '#334155',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(255,255,255,0.7)"
                          strokeWidth="1.5"
                        >
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '6px',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#F8FAFC',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {book?.title || '未知图书'}
                          </p>
                          <span
                            style={{
                              ...getStatusBadgeStyle(record.status),
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            {getStatusText(record.status)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#64748B',
                            marginBottom: '8px',
                          }}
                        >
                          {record.borrowedAt
                            ? `借阅日期：${formatDate(record.borrowedAt)}`
                            : `预约日期：${formatDate(record.reservedAt)}`}
                        </p>
                        {record.status === 'borrowed' && (
                          <p
                            style={{
                              fontSize: '11px',
                              color: isOverdue ? '#EF4444' : '#F59E0B',
                              fontWeight: 500,
                              marginBottom: '8px',
                            }}
                          >
                            {isOverdue
                              ? `已逾期 ${Math.abs(daysRemaining!)} 天`
                              : `剩余 ${daysRemaining} 天 · 应还 ${formatDate(record.dueDate)}`}
                            {record.renewCount > 0 && (
                              <span style={{ marginLeft: '6px', color: '#6366F1' }}>
                                已续借{record.renewCount}次
                              </span>
                            )}
                          </p>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {record.status === 'borrowed' && (
                            <>
                              <button
                                onClick={() => handleReturn(record.id)}
                                disabled={isActionLoading}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  border: 'none',
                                  cursor: isActionLoading ? 'not-allowed' : 'pointer',
                                  backgroundColor: '#EF4444',
                                  color: 'white',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onMouseOver={(e) => {
                                  if (!isActionLoading)
                                    e.currentTarget.style.backgroundColor = '#DC2626';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '#EF4444';
                                }}
                              >
                                {isActionLoading && (
                                  <div
                                    className="loading-spinner"
                                    style={{ width: '12px', height: '12px', borderWidth: '2px' }}
                                  />
                                )}
                                归还
                              </button>
                              {isRenewable && (
                                <button
                                  onClick={() => handleRenew(record)}
                                  disabled={isActionLoading}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    border: '1px solid #22C55E',
                                    cursor: isActionLoading ? 'not-allowed' : 'pointer',
                                    backgroundColor: 'transparent',
                                    color: '#22C55E',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseOver={(e) => {
                                    if (!isActionLoading) {
                                      e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  续借
                                </button>
                              )}
                            </>
                          )}
                          {record.status === 'reserved' && (
                            <button
                              onClick={() => handleCancel(record.id)}
                              disabled={isActionLoading}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: '1px solid #64748B',
                                cursor: isActionLoading ? 'not-allowed' : 'pointer',
                                backgroundColor: 'transparent',
                                color: '#94A3B8',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseOver={(e) => {
                                if (!isActionLoading) {
                                  e.currentTarget.style.borderColor = '#EF4444';
                                  e.currentTarget.style.color = '#EF4444';
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#64748B';
                                e.currentTarget.style.color = '#94A3B8';
                              }}
                            >
                              取消预约
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {currentUser && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #1F2937',
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '16px',
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
                {currentUser.name}
              </p>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                累计借阅 {currentUser.borrowCount} 本
              </p>
            </div>
          </div>
        )}
      </aside>

      {selectedRecord && (
        <BookDetailPage
          book={selectedRecord.bookSnapshot}
          record={selectedRecord}
          isOpen={detailOpen}
          onClose={() => {
            setDetailOpen(false);
          }}
          onRenew={() => handleRenew(selectedRecord)}
          isRenewing={actionLoading === selectedRecord.id}
        />
      )}
    </>
  );
}
