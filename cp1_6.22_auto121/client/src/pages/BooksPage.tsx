import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookApi, stationApi, isbnApi } from '../api';
import type { Book, Station } from '../types';

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isbnLookup, setIsbnLookup] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    coverUrl: '',
    currentStationId: '',
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await bookApi.getAll(page, pageSize);
      setBooks(res.books);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [page]);

  useEffect(() => {
    stationApi.getAll().then(setStations);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  const handleLookup = async () => {
    if (!isbnLookup.trim()) return;
    try {
      setLookupLoading(true);
      const info = await isbnApi.lookup(isbnLookup.trim());
      if (info) {
        setForm({
          ...form,
          isbn: isbnLookup.trim(),
          title: info.title,
          author: info.author,
          coverUrl: info.coverUrl,
        });
        alert('✅ 查询成功！已自动填充图书信息，请补充选择站点后提交');
      } else {
        setForm({ ...form, isbn: isbnLookup.trim() });
        alert('⚠️ 未查询到该ISBN，请手动填写图书信息');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.isbn || !form.title || !form.author || !form.currentStationId) {
      alert('请填写完整的 ISBN、书名、作者并选择站点');
      return;
    }
    try {
      setSubmitting(true);
      await bookApi.create({
        isbn: form.isbn,
        title: form.title,
        author: form.author,
        coverUrl: form.coverUrl || undefined,
        currentStationId: form.currentStationId,
        status: 'in_station',
      });
      setForm({ isbn: '', title: '', author: '', coverUrl: '', currentStationId: '' });
      setIsbnLookup('');
      if (page === 1) loadBooks();
      else setPage(1);
      alert('✅ 图书登记成功！');
    } catch (err: any) {
      alert(err.response?.data?.error || '登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: Book['status']) => {
    const map = {
      in_station: { label: '在站', bg: '#E8F5E9', color: '#4CAF50' },
      drifting: { label: '漂流中', bg: '#E3F2FD', color: '#1976D2' },
      lost: { label: '已丢失', bg: '#FFEBEE', color: '#FF5252' },
    };
    const conf = map[s];
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '12px',
          background: conf.bg,
          color: conf.color,
          fontWeight: 600,
          fontSize: '12px',
          transition: 'all 0.5s ease',
        }}
      >
        {conf.label}
      </span>
    );
  };

  const renderTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#1565C0', color: '#fff' }}>
            <th style={thStyle}>封面</th>
            <th style={thStyle}>书名</th>
            <th style={thStyle}>作者</th>
            <th style={thStyle}>漂流编号</th>
            <th style={thStyle}>状态</th>
            <th style={thStyle}>热度</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b, i) => (
            <tr
              key={b.id}
              style={{
                borderBottom: i < books.length - 1 ? '1px solid #eee' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#F5F9FF')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
            >
              <td style={tdStyle}>
                <img
                  src={b.coverUrl || 'https://picsum.photos/seed/default/60/80'}
                  alt={b.title}
                  style={{
                    width: '40px',
                    height: '56px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </td>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600, color: '#333', maxWidth: '180px' }}>{b.title}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>ISBN: {b.isbn}</div>
              </td>
              <td style={{ ...tdStyle, color: '#555' }}>{b.author}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                {b.driftId}
              </td>
              <td style={tdStyle}>{statusBadge(b.status)}</td>
              <td style={tdStyle}>
                <div style={{ fontSize: '13px', color: '#FF9800', fontWeight: 600 }}>
                  🔥 {b.heatScore}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {b.readCount}次 · {b.totalReadingMinutes}分钟
                </div>
              </td>
              <td style={tdStyle}>
                <Link to={`/books/${b.id}`} style={{ color: '#1976D2', fontSize: '13px', fontWeight: 500 }}>
                  详情 →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {books.map((b) => (
        <div
          key={b.id}
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <img
            src={b.coverUrl || 'https://picsum.photos/seed/default/60/80'}
            alt={b.title}
            style={{
              width: '60px',
              height: '84px',
              borderRadius: '6px',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>{b.title}</div>
              {statusBadge(b.status)}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{b.author}</div>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px' }}>
              📋 {b.driftId}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#FF9800', fontWeight: 600 }}>
                🔥 {b.heatScore}
              </span>
              <Link
                to={`/books/${b.id}`}
                style={{
                  padding: '6px 12px',
                  background: '#1565C0',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                详情
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>
        📖 图书登记与管理
      </h2>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: isMobile ? '12px' : '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                图书列表
                <span style={{ marginLeft: '8px', color: '#888', fontWeight: 400, fontSize: '13px' }}>
                  共 {total} 本
                </span>
              </h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>
            ) : books.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>暂无图书</div>
            ) : isMobile ? (
              renderCards()
            ) : (
              renderTable()
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={pageBtnStyle(page === 1)}
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      ...pageBtnStyle(false),
                      background: p === page ? '#1565C0' : '#fff',
                      color: p === page ? '#fff' : '#333',
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={pageBtnStyle(page === totalPages)}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ width: isMobile ? '100%' : '380px', flexShrink: 0 }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1976D2' }}>
              ➕ 登记新图书
            </h3>

            <label style={labelStyle}>ISBN 号</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <input
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                placeholder="输入ISBN查询..."
                value={isbnLookup}
                onChange={(e) => setIsbnLookup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookup();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading}
                style={{
                  padding: '0 14px',
                  background: '#1976D2',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {lookupLoading ? '查询中' : '🔍 查询'}
              </button>
            </div>

            <label style={labelStyle}>ISBN *</label>
            <input
              style={inputStyle}
              placeholder="ISBN号"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            />

            <label style={labelStyle}>书名 *</label>
            <input
              style={inputStyle}
              placeholder="书名"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label style={labelStyle}>作者 *</label>
            <input
              style={inputStyle}
              placeholder="作者"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />

            <label style={labelStyle}>封面图URL</label>
            <input
              style={inputStyle}
              placeholder="图片链接（选填）"
              value={form.coverUrl}
              onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            />

            <label style={labelStyle}>存放站点 *</label>
            <select
              style={inputStyle}
              value={form.currentStationId}
              onChange={(e) => setForm({ ...form, currentStationId: e.target.value })}
            >
              <option value="">-- 请选择站点 --</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.bookCount}本在架）
                </option>
              ))}
            </select>

            {form.coverUrl && (
              <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                <img
                  src={form.coverUrl}
                  alt="预览"
                  style={{
                    width: '80px',
                    height: '112px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(25,118,210,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(25,118,210,0.2)';
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: submitting ? '#90CAF9' : '#1976D2',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(25,118,210,0.2)',
              }}
            >
              {submitting ? '登记中...' : '✅ 完成登记'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  verticalAlign: 'middle',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#1976D2',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #1976D2',
  borderRadius: '8px',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  backgroundColor: '#fff',
  marginBottom: '14px',
};

const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: disabled ? '#f5f5f5' : '#fff',
  color: disabled ? '#bbb' : '#333',
  fontSize: '13px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
});

export default BooksPage;
