import React, { useState, useEffect } from 'react';
import { fetchBooks, fetchAllRecords, createBook, updateBook, deleteBook } from '../utils/api';
import type { Book, LendingRecord } from '../types';
import { formatDateTime, getStatusText } from '../utils/helpers';

interface AdminPanelProps {
  isOpen: boolean;
}

export default function AdminPanel({ isOpen }: AdminPanelProps) {
  const [activeMenu, setActiveMenu] = useState<'books' | 'records'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '文学小说',
    isbn: '',
    description: '',
    totalCopies: '1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const categories = [
    '文学小说',
    '科学技术',
    '历史传记',
    '经济管理',
    '艺术设计',
    '儿童读物',
    '哲学思想',
    '生活百科',
  ];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeMenu]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeMenu === 'books') {
        const booksRes = await fetchBooks({ limit: 100 });
        if (booksRes.success) setBooks(booksRes.data);
      } else {
        const recordsRes = await fetchAllRecords();
        if (recordsRes.success) {
          setRecords(recordsRes.data);
          setStats(recordsRes.stats);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      category: '文学小说',
      isbn: '',
      description: '',
      totalCopies: '1',
    });
    setShowAddModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      description: book.description,
      totalCopies: String(book.totalCopies),
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      showMessage('error', '书名和作者为必填项');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBook) {
        const res = await updateBook(editingBook.id, formData);
        if (res.success) {
          showMessage('success', '图书更新成功');
          setShowAddModal(false);
          loadData();
        }
      } else {
        const res = await createBook({
          ...formData,
          totalCopies: parseInt(formData.totalCopies),
        });
        if (res.success) {
          showMessage('success', '图书添加成功');
          setShowAddModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      showMessage('error', err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`确定要删除《${book.title}》吗？`)) return;
    try {
      const res = await deleteBook(book.id);
      if (res.success) {
        showMessage('success', '图书删除成功');
        loadData();
      }
    } catch (err: any) {
      showMessage('error', err.message || '删除失败');
    }
  };

  if (!isOpen) return null;

  const menuItems = [
    {
      key: 'books' as const,
      label: '图书管理',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      key: 'records' as const,
      label: '借阅记录',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  const statCards = stats
    ? [
        { label: '总记录数', value: stats.total, color: '#6366F1' },
        { label: '待确认预约', value: stats.reserved, color: '#F59E0B' },
        { label: '借阅中', value: stats.borrowed, color: '#6366F1' },
        { label: '已归还', value: stats.returned, color: '#22C55E' },
        { label: '已逾期', value: stats.overdue, color: '#EF4444' },
      ]
    : [];

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      available: '#22C55E',
      borrowed: '#EF4444',
      reserved: '#F59E0B',
      returned: '#64748B',
    };
    return colors[status] || '#64748B';
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        padding: '24px',
        minHeight: 'calc(100vh - 64px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
      className="admin-panel-container"
    >
      <aside
        style={{
          width: '220px',
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          padding: '8px',
          flexShrink: 0,
          height: 'fit-content',
          position: 'sticky',
          top: '84px',
        }}
        className="admin-sidebar"
      >
        <div style={{ padding: '12px 12px 8px' }}>
          <p
            style={{
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            管理中心
          </p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveMenu(item.key)}
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: activeMenu === item.key ? '#6366F1' : 'transparent',
              color: activeMenu === item.key ? '#F8FAFC' : '#94A3B8',
              transition: 'all 0.2s ease',
              marginBottom: '4px',
            }}
            onMouseOver={(e) => {
              if (activeMenu !== item.key) {
                e.currentTarget.style.backgroundColor = '#334155';
              }
            }}
            onMouseOut={(e) => {
              if (activeMenu !== item.key) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        {activeMenu === 'books' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    margin: 0,
                    marginBottom: '4px',
                  }}
                >
                  图书管理
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  共 {books.length} 本图书
                </p>
              </div>
              <button
                onClick={openAddModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                添加图书
              </button>
            </div>

            {actionMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  backgroundColor: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${actionMessage.type === 'success' ? '#22C55E' : '#EF4444'}`,
                  color: actionMessage.type === 'success' ? '#22C55E' : '#EF4444',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {actionMessage.text}
              </div>
            )}

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
              className="admin-table-container"
            >
              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '700px',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#0F172A' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        图书
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        分类
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        状态
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        库存
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px 16px', textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px',
                              color: '#64748B',
                            }}
                          >
                            <div className="loading-spinner" />
                            加载中...
                          </div>
                        </td>
                      </tr>
                    ) : books.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px 16px', textAlign: 'center', color: '#64748B' }}>
                          暂无图书数据
                        </td>
                      </tr>
                    ) : (
                      books.map((book) => (
                        <tr
                          key={book.id}
                          style={{
                            borderTop: '1px solid #334155',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '48px',
                                  height: '64px',
                                  borderRadius: '6px',
                                  backgroundColor: book.coverColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#F8FAFC',
                                    margin: 0,
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {book.title}
                                </p>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                  {book.author}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#334155',
                                color: '#94A3B8',
                                fontSize: '12px',
                              }}
                            >
                              {book.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: `${getStatusBadgeColor(book.status)}20`,
                                color: getStatusBadgeColor(book.status),
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: getStatusBadgeColor(book.status),
                                }}
                              />
                              {getStatusText(book.status)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: '#94A3B8' }}>
                            {book.availableCopies} / {book.totalCopies}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <button
                                onClick={() => openEditModal(book)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #334155',
                                  color: '#94A3B8',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = '#6366F1';
                                  e.currentTarget.style.color = '#6366F1';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = '#334155';
                                  e.currentTarget.style.color = '#94A3B8';
                                }}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(book)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #334155',
                                  color: '#94A3B8',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = '#EF4444';
                                  e.currentTarget.style.color = '#EF4444';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = '#334155';
                                  e.currentTarget.style.color = '#94A3B8';
                                }}
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'records' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  margin: 0,
                  marginBottom: '16px',
                }}
              >
                借阅记录
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#1E293B',
                      borderRadius: '10px',
                      padding: '16px',
                      borderLeft: `3px solid ${stat.color}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        margin: 0,
                        marginBottom: '6px',
                      }}
                    >
                      {stat.label}
                    </p>
                    <p
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: stat.color,
                        margin: 0,
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
              className="admin-table-container"
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '900px',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#0F172A' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                        }}
                      >
                        图书
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                        }}
                      >
                        读者
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                        }}
                      >
                        状态
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                        }}
                      >
                        预约时间
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '14px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748B',
                          textTransform: 'uppercase',
                        }}
                      >
                        应还日期
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px 16px', textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px',
                              color: '#64748B',
                            }}
                          >
                            <div className="loading-spinner" />
                            加载中...
                          </div>
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px 16px', textAlign: 'center', color: '#64748B' }}>
                          暂无借阅记录
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr
                          key={record.id}
                          style={{
                            borderTop: '1px solid #334155',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)')
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '52px',
                                  borderRadius: '6px',
                                  backgroundColor: record.bookSnapshot?.coverColor || '#334155',
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#F8FAFC',
                                    margin: 0,
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {record.bookSnapshot?.title}
                                </p>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                  {record.bookSnapshot?.author}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                {record.userSnapshot?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontSize: '13px',
                                    color: '#F8FAFC',
                                    margin: 0,
                                    fontWeight: 500,
                                  }}
                                >
                                  {record.userSnapshot?.name || '未知用户'}
                                </p>
                                <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                                  {record.userSnapshot?.role === 'admin' ? '管理员' : '读者'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: `${getStatusBadgeColor(record.status)}20`,
                                color: getStatusBadgeColor(record.status),
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: getStatusBadgeColor(record.status),
                                }}
                              />
                              {getStatusText(record.status)}
                              {record.renewCount > 0 && (
                                <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                                  · 续{record.renewCount}次
                                </span>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94A3B8' }}>
                            {formatDateTime(record.reservedAt)}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94A3B8' }}>
                            {formatDateTime(record.dueDate) || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '24px',
              animation: 'slideUp 0.3s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  margin: 0,
                }}
              >
                {editingBook ? '编辑图书' : '添加图书'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#334155',
                  color: '#94A3B8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    marginBottom: '6px',
                  }}
                >
                  书名 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入书名"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    marginBottom: '6px',
                  }}
                >
                  作者 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="请输入作者"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#94A3B8',
                      marginBottom: '6px',
                    }}
                  >
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#1E293B' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '140px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#94A3B8',
                      marginBottom: '6px',
                    }}
                  >
                    库存数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    marginBottom: '6px',
                  }}
                >
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="请输入ISBN（选填）"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    marginBottom: '6px',
                  }}
                >
                  内容简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入图书简介（选填）"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
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
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'filter 0.2s ease',
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                {isSubmitting && (
                  <div
                    className="loading-spinner"
                    style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                  />
                )}
                {editingBook ? '保存修改' : '添加图书'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-panel-container { flex-direction: column; padding: 16px !important; }
          .admin-sidebar {
            width: 100% !important;
            position: static !important;
            display: flex;
            gap: 4px;
            padding: 4px !important;
          }
          .admin-sidebar > div:first-child { display: none; }
          .admin-sidebar button {
            flex: 1;
            justify-content: center;
            height: 40px !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
