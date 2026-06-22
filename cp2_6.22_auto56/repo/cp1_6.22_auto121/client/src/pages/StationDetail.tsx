import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { stationApi, bookApi, recordApi } from '../api';
import type { Station, Book, DriftRecord } from '../types';

const StationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<Station | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<DriftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [bookPage, setBookPage] = useState(1);
  const [bookTotal, setBookTotal] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [s, bRes, r] = await Promise.all([
        stationApi.getById(id),
        bookApi.getAll(bookPage, pageSize, id),
        recordApi.get(undefined, id),
      ]);
      setStation(s);
      setBooks(bRes.books);
      setBookTotal(bRes.total);
      setRecords(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, bookPage]);

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
          padding: '2px 8px',
          borderRadius: '10px',
          background: conf.bg,
          color: conf.color,
          fontWeight: 600,
          fontSize: '11px',
        }}
      >
        {conf.label}
      </span>
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>加载中...</div>
    );
  }

  if (!station) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', fontSize: '48px' }}>📍</div>
        <div style={{ color: '#666', marginBottom: '16px' }}>未找到该站点</div>
        <button
          onClick={() => navigate('/stations')}
          style={{ padding: '10px 20px', background: '#1565C0', color: '#fff', borderRadius: '8px' }}
        >
          返回站点列表
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(bookTotal / pageSize);

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          color: '#1565C0',
          fontSize: '14px',
          marginBottom: '16px',
          fontWeight: 500,
        }}
      >
        ← 返回
      </button>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: isMobile ? '16px' : '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: isMobile ? '56px' : '64px',
              height: isMobile ? '56px' : '64px',
              background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '28px' : '32px',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
            }}
          >
            📍
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
              {station.name}
            </h1>
            <p style={{ fontSize: '13px', color: '#666' }}>
              📌 {station.address}
            </p>
          </div>
          <div
            style={{
              padding: '10px 18px',
              background: '#E8F5E9',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>在架图书</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#4CAF50' }}>
              {station.bookCount}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
          <div
            style={{
              padding: '12px 14px',
              background: '#F5F5F5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <div style={{ color: '#888', marginBottom: '4px' }}>📍 经纬度</div>
            <div style={{ color: '#333', fontWeight: 500 }}>
              {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
            </div>
          </div>
          <div
            style={{
              padding: '12px 14px',
              background: '#F5F5F5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <div style={{ color: '#888', marginBottom: '4px' }}>📞 联系方式</div>
            <div style={{ color: '#333', fontWeight: 500 }}>{station.contact || '暂无'}</div>
          </div>
          <div
            style={{
              padding: '12px 14px',
              background: '#F5F5F5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <div style={{ color: '#888', marginBottom: '4px' }}>📊 站点活动数</div>
            <div style={{ color: '#333', fontWeight: 500 }}>{records.length} 次记录</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: isMobile ? '16px' : '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#333' }}>
              📚 在架图书
              <span style={{ marginLeft: '6px', color: '#888', fontSize: '12px', fontWeight: 400 }}>
                共 {bookTotal} 本
              </span>
            </h3>
          </div>

          {books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '13px' }}>
              该站点暂无图书
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {books.map((b) => (
                <Link
                  key={b.id}
                  to={`/books/${b.id}`}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={b.coverUrl || 'https://picsum.photos/seed/default/60/80'}
                    alt={b.title}
                    style={{
                      width: '44px',
                      height: '62px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '2px' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                      {b.author}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#999' }}>{b.driftId}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#FF9800',
                          fontWeight: 600,
                        }}
                      >
                        🔥 {b.heatScore}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setBookPage(p)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: p === bookPage ? '#1565C0' : '#F5F5F5',
                    color: p === bookPage ? '#fff' : '#666',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: isMobile ? '16px' : '20px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#333', marginBottom: '16px' }}>
            📋 最近活动记录
          </h3>

          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '13px' }}>
              暂无活动记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: isMobile ? 'none' : '480px', overflowY: 'auto' }}>
              {records.slice(0, 15).map((r) => {
                const colors: Record<string, string> = {
                  register: '#9C27B0',
                  check_out: '#1976D2',
                  check_in: '#4CAF50',
                  lost: '#FF5252',
                };
                const icons: Record<string, string> = {
                  register: '📥',
                  check_out: '📤',
                  check_in: '📍',
                  lost: '⚠️',
                };
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#FAFAFA',
                      borderLeft: `3px solid ${colors[r.type]}`,
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: `${colors[r.type]}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {icons[r.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px', lineHeight: 1.4 }}>
                        {r.note}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link
                          to={`/books/${r.bookId}`}
                          style={{
                            fontSize: '11px',
                            color: '#1565C0',
                            fontWeight: 500,
                          }}
                        >
                          查看图书 →
                        </Link>
                        <span style={{ fontSize: '10px', color: '#999' }}>
                          {formatTime(r.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationDetail;
