import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookApi, stationApi, recordApi } from '../api';
import type { Book, Station, DriftRecord } from '../types';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [records, setRecords] = useState<DriftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [showAction, setShowAction] = useState(false);
  const [actionStatus, setActionStatus] = useState<'drifting' | 'in_station' | 'lost'>('drifting');
  const [targetStation, setTargetStation] = useState('');
  const [readingMinutes, setReadingMinutes] = useState('');
  const [updating, setUpdating] = useState(false);

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
      const [b, s, r] = await Promise.all([
        bookApi.getById(id),
        stationApi.getAll(),
        recordApi.get(id),
      ]);
      setBook(b);
      setStations(s);
      setRecords(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

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
          padding: '6px 14px',
          borderRadius: '16px',
          background: conf.bg,
          color: conf.color,
          fontWeight: 700,
          fontSize: '13px',
          transition: 'all 0.5s ease',
          boxShadow: `inset 0 0 0 1px ${conf.color}33`,
        }}
      >
        {conf.label}
      </span>
    );
  };

  const stationName = (sid: string | undefined) =>
    stations.find((s) => s.id === sid)?.name || '-';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const recordIcon = (t: DriftRecord['type']) => {
    switch (t) {
      case 'register':
        return '📥';
      case 'check_out':
        return '📤';
      case 'check_in':
        return '📍';
      case 'lost':
        return '⚠️';
    }
  };

  const recordColor = (t: DriftRecord['type']) => {
    switch (t) {
      case 'register':
        return '#9C27B0';
      case 'check_out':
        return '#1976D2';
      case 'check_in':
        return '#4CAF50';
      case 'lost':
        return '#FF5252';
    }
  };

  const handleAction = async () => {
    if (!id || !book) return;
    try {
      setUpdating(true);
      const minutes = actionStatus === 'in_station' ? Number(readingMinutes) || 0 : undefined;
      const stationId = actionStatus === 'in_station' ? targetStation || undefined : book.currentStationId || undefined;
      const updated = await bookApi.updateStatus(id, actionStatus, stationId, minutes);
      setBook(updated);
      setShowAction(false);
      setReadingMinutes('');
      setTargetStation('');
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    } finally {
      setUpdating(false);
    }
  };

  const totalHours = book ? Math.floor(book.totalReadingMinutes / 60) : 0;
  const remainMinutes = book ? book.totalReadingMinutes % 60 : 0;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>加载中...</div>
    );
  }

  if (!book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', fontSize: '48px' }}>📭</div>
        <div style={{ color: '#666', marginBottom: '16px' }}>未找到该图书</div>
        <button
          onClick={() => navigate('/books')}
          style={{
            padding: '10px 20px',
            background: '#1565C0',
            color: '#fff',
            borderRadius: '8px',
          }}
        >
          返回图书列表
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1000px', margin: '0 auto' }}>
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
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginBottom: '24px',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <div
          style={{
            background: '#333',
            color: '#fff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>漂流编号</span>
            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, letterSpacing: '1px' }}>
              {book.driftId}
            </span>
          </div>
          {statusBadge(book.status)}
        </div>

        <div style={{ padding: isMobile ? '16px' : '24px' }}>
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '14px' : '24px',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
            }}
          >
            <img
              src={book.coverUrl || 'https://picsum.photos/seed/default/200/300'}
              alt={book.title}
              style={{
                width: isMobile ? '140px' : '180px',
                height: isMobile ? '200px' : '260px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/default/200/300';
              }}
            />

            <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#333', marginBottom: '6px' }}>
                {book.title}
              </h1>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                ✍️ {book.author}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <InfoItem label="ISBN" value={book.isbn} />
                <InfoItem label="当前站点" value={book.currentStationId ? stationName(book.currentStationId) : '-'} />
                <InfoItem label="阅读次数" value={`${book.readCount} 次`} />
                <InfoItem
                  label="累计阅读时长"
                  value={`${totalHours}小时 ${remainMinutes}分钟`}
                />
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#E65100' }}>🔥 阅读热度评分</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#FF6F00', marginTop: '2px' }}>
                      {book.heatScore}
                    </div>
                  </div>
                  <div style={{ width: isMobile ? '100%' : '55%' }}>
                    <div
                      style={{
                        height: '10px',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min((book.heatScore / 500) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #FFA726, #FF6F00)',
                          borderRadius: '5px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#E65100', marginTop: '4px', textAlign: 'right' }}>
                      满分 500
                    </div>
                  </div>
                </div>
              </div>

              {!showAction ? (
                <button
                  onClick={() => setShowAction(true)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(21,101,192,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(21,101,192,0.2)';
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1565C0',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(21,101,192,0.2)',
                  }}
                >
                  🔄 更新图书状态
                </button>
              ) : (
                <div
                  style={{
                    border: '2px solid #1976D2',
                    borderRadius: '10px',
                    padding: '16px',
                    background: '#E3F2FD',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1976D2', marginBottom: '12px' }}>
                    选择新状态：
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {(['drifting', 'in_station', 'lost'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActionStatus(s)}
                        style={{
                          flex: 1,
                          minWidth: '80px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: actionStatus === s ? '#1976D2' : '#fff',
                          color: actionStatus === s ? '#fff' : '#333',
                          border: `1px solid ${actionStatus === s ? '#1976D2' : '#ddd'}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {s === 'drifting' ? '📤 借出漂流' : s === 'in_station' ? '📍 归还站点' : '⚠️ 标记丢失'}
                      </button>
                    ))}
                  </div>

                  {actionStatus === 'in_station' && (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>目标站点 *</div>
                        <select
                          value={targetStation}
                          onChange={(e) => setTargetStation(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">请选择归还站点</option>
                          {stations.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                          本次阅读时长（分钟）
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={readingMinutes}
                          onChange={(e) => setReadingMinutes(e.target.value)}
                          placeholder="例如：120"
                          style={selectStyle}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAction(false)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#555',
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={updating || (actionStatus === 'in_station' && !targetStation)}
                      style={{
                        flex: 2,
                        padding: '10px',
                        background: updating ? '#90CAF9' : '#1976D2',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {updating ? '提交中...' : '确认提交'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: isMobile ? '16px' : '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '20px' }}>
          📜 漂流轨迹
        </h3>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>暂无漂流记录</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div
              style={{
                position: 'absolute',
                left: '8px',
                top: '6px',
                bottom: '6px',
                width: '2px',
                background: '#eee',
              }}
            />
            {records.map((r, idx) => (
              <div key={r.id} style={{ position: 'relative', marginBottom: idx === records.length - 1 ? 0 : '20px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: recordColor(r.type),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 2,
                  }}
                >
                  {recordIcon(r.type)}
                </div>
                <div
                  style={{
                    background: '#FAFAFA',
                    borderLeft: `3px solid ${recordColor(r.type)}`,
                    padding: '12px 14px',
                    borderRadius: '0 8px 8px 0',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
                    (e.currentTarget as HTMLDivElement).style.background = '#F5F9FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                    (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                      {r.note}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {formatTime(r.timestamp)}
                    </div>
                  </div>
                  {r.stationId && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      📍 {stationName(r.stationId)}
                    </div>
                  )}
                  {r.readingMinutes && r.readingMinutes > 0 && (
                    <div style={{ fontSize: '12px', color: '#FF9800', marginTop: '4px' }}>
                      ⏱️ 阅读 {r.readingMinutes} 分钟
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      padding: '10px 12px',
      background: '#F5F5F5',
      borderRadius: '8px',
    }}
  >
    <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>{value}</div>
  </div>
);

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '13px',
  background: '#fff',
};

export default BookDetail;
