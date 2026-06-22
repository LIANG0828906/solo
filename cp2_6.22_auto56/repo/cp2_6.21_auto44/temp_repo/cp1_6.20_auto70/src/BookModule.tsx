import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import {
  Book,
  ReadingStatus,
  AppContext,
  STATUS_LABELS,
  STATUS_COLORS,
  NOTE_TAGS,
} from './types';
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  exportData,
  importData,
} from './dataService';

const e = React.createElement;

function LoadingSpinner() {
  return e('div', {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '80px 0',
    },
  },
    e('svg', {
      className: 'loading-spinner',
      width: 48,
      height: 48,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#6B8DAE',
      strokeWidth: 1.5,
    },
      e('path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }),
      e('path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }),
      e('path', { d: 'M8 7h8M8 11h5' })
    )
  );
}

function EmptyState(props: { onAddBook: () => void }) {
  return e('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: '#8D7B6A',
    },
  },
    e('svg', {
      width: 80,
      height: 80,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#D4C5B2',
      strokeWidth: 1.2,
      style: { marginBottom: 16 },
    },
      e('path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }),
      e('path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }),
      e('path', { d: 'M12 7v5M9.5 9.5h5' })
    ),
    e('p', {
      style: { fontSize: 16, marginBottom: 16, fontWeight: 500 },
    }, '还没有找到匹配的书籍'),
    e('button', {
      className: 'btn-hover',
      onClick: props.onAddBook,
      style: {
        background: '#6B8DAE',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 20px',
        fontSize: 14,
        cursor: 'pointer',
        fontWeight: 600,
      },
    }, '添加新书')
  );
}

function BookCard(props: { book: Book; onClick: () => void }) {
  const { book } = props;
  const statusColor = STATUS_COLORS[book.status];
  const progress = book.totalPages > 0
    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
    : 0;

  const coverBlock = book.coverUrl
    ? e('img', {
        src: book.coverUrl,
        alt: book.title,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '8px 8px 0 0',
        },
      })
    : e('div', {
        style: {
          width: '100%',
          height: '100%',
          background: statusColor.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          fontFamily: "'Playfair Display', serif",
        },
      }, book.title.charAt(0));

  return e('div', {
    className: 'book-card',
    onClick: props.onClick,
    style: {
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #EDE7DF',
      cursor: 'pointer',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(92,61,46,0.06)',
    },
  },
    e('div', {
      style: {
        position: 'relative',
        height: 160,
        overflow: 'hidden',
      },
    },
      coverBlock,
      e('span', {
        className: 'tag-badge',
        style: {
          position: 'absolute',
          top: 10,
          right: 10,
          background: statusColor.bg,
          color: statusColor.text,
        },
      }, STATUS_LABELS[book.status])
    ),
    e('div', {
      style: { padding: '14px 16px 16px' },
    },
      e('h3', {
        style: {
          fontSize: 16,
          fontWeight: 700,
          color: '#5C3D2E',
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: "'Playfair Display', serif",
        },
      }, book.title),
      e('p', {
        style: {
          fontSize: 13,
          color: '#8D7B6A',
          marginBottom: 12,
        },
      }, book.author),
      e('div', {
        className: 'progress-bar-bg',
        style: { marginBottom: 6 },
      },
        e('div', {
          className: 'progress-bar-fill',
          style: {
            width: progress + '%',
            background: statusColor.gradient,
          },
        })
      ),
      e('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#B0A090',
        },
      },
        e('span', null, book.currentPage + ' / ' + book.totalPages + ' 页'),
        book.lastReadDate
          ? e('span', null, format(new Date(book.lastReadDate), 'MM/dd'))
          : null
      )
    )
  );
}

function AddBookModal(props: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('want_to_read');
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!title.trim() || !author.trim() || !totalPages) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const newBook: Book = {
        id: uuidv4(),
        title: title.trim(),
        author: author.trim(),
        totalPages: Number(totalPages),
        coverUrl: coverUrl.trim() || undefined,
        status,
        currentPage: 0,
        lastReadDate: '',
        addedAt: now,
        readingDays: 0,
        todayReadingMinutes: 0,
      };
      await addBook(newBook);
      props.onSaved();
      props.onClose();
    } finally {
      setSaving(false);
    }
  }, [title, author, totalPages, coverUrl, status, props]);

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #EDE7DF',
    borderRadius: 8,
    fontSize: 14,
    color: '#5C3D2E',
    background: '#FAFAFA',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#5C3D2E',
    marginBottom: 4,
  };

  return e('div', {
    onClick: props.onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(92,61,46,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
  },
    e('div', {
      className: 'modal-in',
      onClick: (ev: React.MouseEvent) => ev.stopPropagation(),
      style: {
        background: '#fff',
        borderRadius: 16,
        padding: 28,
        width: 420,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 16px 48px rgba(92,61,46,0.18)',
      },
    },
      e('h2', {
        style: {
          fontSize: 20,
          fontWeight: 700,
          color: '#5C3D2E',
          marginBottom: 20,
          fontFamily: "'Playfair Display', serif",
        },
      }, '添加新书'),
      e('form', { onSubmit: handleSubmit },
        e('div', { style: { marginBottom: 14 } },
          e('label', { style: labelStyle }, '书名 *'),
          e('input', {
            style: fieldStyle,
            value: title,
            onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setTitle(ev.target.value),
            placeholder: '输入书名',
            required: true,
          })
        ),
        e('div', { style: { marginBottom: 14 } },
          e('label', { style: labelStyle }, '作者 *'),
          e('input', {
            style: fieldStyle,
            value: author,
            onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setAuthor(ev.target.value),
            placeholder: '输入作者',
            required: true,
          })
        ),
        e('div', { style: { marginBottom: 14 } },
          e('label', { style: labelStyle }, '总页数 *'),
          e('input', {
            style: fieldStyle,
            type: 'number',
            min: 1,
            value: totalPages,
            onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setTotalPages(ev.target.value),
            placeholder: '输入总页数',
            required: true,
          })
        ),
        e('div', { style: { marginBottom: 14 } },
          e('label', { style: labelStyle }, '封面链接'),
          e('input', {
            style: fieldStyle,
            value: coverUrl,
            onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setCoverUrl(ev.target.value),
            placeholder: '可选，输入封面图片 URL',
          })
        ),
        e('div', { style: { marginBottom: 20 } },
          e('label', { style: labelStyle }, '阅读状态'),
          e('select', {
            style: { ...fieldStyle, cursor: 'pointer' },
            value: status,
            onChange: (ev: React.ChangeEvent<HTMLSelectElement>) =>
              setStatus(ev.target.value as ReadingStatus),
          },
            (['want_to_read', 'reading', 'read'] as ReadingStatus[]).map(function(s) {
              return e('option', { key: s, value: s }, STATUS_LABELS[s]);
            })
          )
        ),
        e('div', {
          style: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
        },
          e('button', {
            type: 'button',
            className: 'btn-hover',
            onClick: props.onClose,
            style: {
              background: '#EDE7DF',
              color: '#5C3D2E',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
            },
          }, '取消'),
          e('button', {
            type: 'submit',
            className: 'btn-hover',
            disabled: saving,
            style: {
              background: '#6B8DAE',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: saving ? 0.7 : 1,
            },
          }, saving ? '保存中...' : '添加')
        )
      )
    )
  );
}

function ImportConfirmModal(props: {
  onClose: () => void;
  onConfirm: (mode: 'overwrite' | 'merge') => void;
}) {
  return e('div', {
    onClick: props.onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(92,61,46,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
  },
    e('div', {
      className: 'modal-in',
      onClick: (ev: React.MouseEvent) => ev.stopPropagation(),
      style: {
        background: '#fff',
        borderRadius: 16,
        padding: 28,
        width: 360,
        maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(92,61,46,0.18)',
      },
    },
      e('h2', {
        style: {
          fontSize: 18,
          fontWeight: 700,
          color: '#5C3D2E',
          marginBottom: 12,
          fontFamily: "'Playfair Display', serif",
        },
      }, '导入数据'),
      e('p', {
        style: {
          fontSize: 14,
          color: '#8D7B6A',
          marginBottom: 20,
          lineHeight: 1.6,
        },
      }, '请选择导入方式：'),
      e('div', {
        style: { display: 'flex', gap: 10, justifyContent: 'center' },
      },
        e('button', {
          className: 'btn-hover',
          onClick: function() { props.onConfirm('overwrite'); },
          style: {
            background: '#E65100',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          },
        }, '覆盖导入'),
        e('button', {
          className: 'btn-hover',
          onClick: function() { props.onConfirm('merge'); },
          style: {
            background: '#6B8DAE',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          },
        }, '合并导入')
      ),
      e('button', {
        className: 'btn-hover',
        onClick: props.onClose,
        style: {
          marginTop: 14,
          background: 'transparent',
          color: '#8D7B6A',
          border: 'none',
          fontSize: 13,
          cursor: 'pointer',
          display: 'block',
          margin: '14px auto 0',
        },
      }, '取消')
    )
  );
}

function Toast(props: { message: string; visible: boolean }) {
  if (!props.visible) return null;
  return e('div', {
    className: 'fade-in',
    style: {
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#5C3D2E',
      color: '#FAF6F1',
      padding: '10px 24px',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 500,
      boxShadow: '0 4px 16px rgba(92,61,46,0.2)',
      zIndex: 2000,
      whiteSpace: 'nowrap',
    },
  }, props.message);
}

export default function BookModule() {
  const ctx = useContext(AppContext);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadBooks = useCallback(async function() {
    setLoading(true);
    try {
      const list = await getBooks();
      setBooks(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function() {
    loadBooks();
  }, [loadBooks, ctx.refreshTrigger]);

  useEffect(function() {
    const timer = setTimeout(function() {
      setDebouncedSearch(searchText);
    }, 300);
    return function() { clearTimeout(timer); };
  }, [searchText]);

  const filteredBooks = useMemo(function() {
    let result = books;
    if (filterStatus !== 'all') {
      result = result.filter(function(b) { return b.status === filterStatus; });
    }
    if (debouncedSearch.trim()) {
      const kw = debouncedSearch.trim().toLowerCase();
      result = result.filter(function(b) {
        return b.title.toLowerCase().indexOf(kw) >= 0 ||
               b.author.toLowerCase().indexOf(kw) >= 0;
      });
    }
    return result;
  }, [books, filterStatus, debouncedSearch]);

  const showToast = useCallback(function(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(function() { setToastVisible(false); }, 3000);
  }, []);

  const handleExport = useCallback(async function() {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      saveAs(blob, 'readmark-data-' + format(new Date(), 'yyyy-MM-dd') + '.json');
      showToast('导出成功！');
    } catch {
      showToast('导出失败，请重试');
    }
  }, [showToast]);

  const handleImportFile = useCallback(function(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target && (e.target as FileReader).result as string;
      setImportJson(text);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    ev.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(async function(mode: 'overwrite' | 'merge') {
    setShowImportModal(false);
    try {
      const result = await importData(importJson, mode);
      showToast(
        '新增图书 ' + result.newBooks + ' 本，新增笔记 ' + result.newNotes + ' 条，重复项 ' + result.duplicates + ' 个'
      );
      await loadBooks();
      ctx.triggerRefresh();
    } catch {
      showToast('导入失败，请检查文件格式');
    }
  }, [importJson, loadBooks, ctx, showToast]);

  const navBtnStyle: React.CSSProperties = {
    background: '#EDE7DF',
    color: '#5C3D2E',
    border: 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const filterBtnActive: React.CSSProperties = {
    background: '#6B8DAE',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  };

  const filterBtnInactive: React.CSSProperties = {
    background: '#EDE7DF',
    color: '#5C3D2E',
    border: 'none',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  };

  return e('div', null,
    e('nav', {
      className: 'nav-glass',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 24px',
        borderBottom: '1px solid rgba(237,231,223,0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      },
    },
      e('h1', {
        style: {
          fontSize: 22,
          fontWeight: 700,
          color: '#5C3D2E',
          fontFamily: "'Playfair Display', serif",
          marginRight: 8,
          whiteSpace: 'nowrap',
        },
      }, 'ReadMark'),
      e('div', {
        style: { position: 'relative', flex: '1 1 200px', minWidth: 160, maxWidth: 320 },
      },
        e('input', {
          type: 'text',
          placeholder: '搜索书名或作者...',
          value: searchText,
          onChange: function(ev: React.ChangeEvent<HTMLInputElement>) {
            setSearchText(ev.target.value);
          },
          style: {
            width: '100%',
            padding: '7px 12px 7px 34px',
            border: '1px solid #EDE7DF',
            borderRadius: 8,
            fontSize: 14,
            color: '#5C3D2E',
            background: '#FAFAFA',
            outline: 'none',
          },
        }),
        e('svg', {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: '#B0A090',
          strokeWidth: 2,
          style: {
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
          },
        },
          e('circle', { cx: 11, cy: 11, r: 8 }),
          e('line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
        )
      ),
      e('div', {
        style: {
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        },
      },
        e('button', {
          className: 'btn-hover',
          onClick: function() { setFilterStatus('all'); },
          style: filterStatus === 'all' ? filterBtnActive : filterBtnInactive,
        }, '全部'),
        (['want_to_read', 'reading', 'read'] as ReadingStatus[]).map(function(s) {
          return e('button', {
            key: s,
            className: 'btn-hover',
            onClick: function() { setFilterStatus(s); },
            style: filterStatus === s ? filterBtnActive : filterBtnInactive,
          }, STATUS_LABELS[s]);
        })
      ),
      e('div', {
        style: { display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' },
      },
        e('button', {
          className: 'btn-hover',
          onClick: handleExport,
          style: navBtnStyle,
        }, '导出'),
        e('button', {
          className: 'btn-hover',
          onClick: function() {
            if (fileInputRef.current) fileInputRef.current.click();
          },
          style: navBtnStyle,
        }, '导入'),
        e('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.json',
          onChange: handleImportFile,
          style: { display: 'none' },
        }),
        e('button', {
          className: 'btn-hover',
          onClick: function() { setShowAddModal(true); },
          style: {
            background: '#6B8DAE',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '7px 18px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          },
        }, '添加图书')
      )
    ),

    e('main', {
      style: {
        padding: '80px 24px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      },
    },
      loading
        ? e(LoadingSpinner)
        : filteredBooks.length === 0
          ? e(EmptyState, { onAddBook: function() { setShowAddModal(true); } })
          : e('div', {
              className: 'book-card-grid fade-in',
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
              },
            },
              filteredBooks.map(function(book) {
                return e(BookCard, {
                  key: book.id,
                  book: book,
                  onClick: function() { ctx.setSelectedBookId(book.id); },
                });
              })
            )
    ),

    showAddModal
      ? e(AddBookModal, {
          onClose: function() { setShowAddModal(false); },
          onSaved: loadBooks,
        })
      : null,

    showImportModal
      ? e(ImportConfirmModal, {
          onClose: function() { setShowImportModal(false); setImportJson(''); },
          onConfirm: handleImportConfirm,
        })
      : null,

    e(Toast, { message: toastMessage, visible: toastVisible })
  );
}
