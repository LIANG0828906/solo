import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { useFacilityStore } from '../facility/facilityStore';
import { formatDateTime } from '../facility/facilityService';
import type { Booking } from '../facility/types';

type FilterType = 'all' | 'upcoming' | 'past';

export default function UserProfile() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<'slideInLeft' | 'slideInRight'>('slideInLeft');

  const {
    currentUser,
    facilities = [],
    getUserBookings,
    deleteBooking,
    showNotification,
    getFacilityStats,
    getDailyStats,
  } = useFacilityStore();

  const allBookings = currentUser ? getUserBookings(currentUser.id) : [];

  const filteredBookings = allBookings.filter((b) => {
    const start = parseISO(b.startTime);
    if (filter === 'upcoming') return !isBefore(start, new Date());
    if (filter === 'past') return isBefore(start, new Date()) && !isToday(start);
    return true;
  });

  const handleFilterChange = (f: FilterType) => {
    setView(f !== filter ? (['upcoming', 'past', 'all'].indexOf(f) > ['upcoming', 'past', 'all'].indexOf(filter) ? 'slideInRight' : 'slideInLeft') : view);
    setFilter(f);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要取消此预约吗？')) {
      await deleteBooking(id);
      showNotification('success', '预约已取消');
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const labels = { pending: '待审核', confirmed: '已确认', rejected: '已驳回' };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  const getFacility = (id: string) => facilities.find((f) => f.id === id);

  const confirmedCount = allBookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = allBookings.filter((b) => b.status === 'pending').length;
  const rejectedCount = allBookings.filter((b) => b.status === 'rejected').length;

  const facilityStats = getFacilityStats(30).filter((s) => s.totalBookings > 0);
  const dailyStats = getDailyStats(30);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'upcoming', label: '即将到来' },
    { key: 'past', label: '历史记录' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>👤</span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600 }}>我的预约</h1>
              <p className="text-muted">{currentUser?.name} {currentUser?.roomNumber ? `(${currentUser.roomNumber})` : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/" className="btn btn-ghost">
              🏠 返回首页
            </Link>
            <Link to="/admin" className="btn btn-ghost">
              🔧 管理后台
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>已确认预约</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>{confirmedCount}</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>待审核</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--warning)' }}>{pendingCount}</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>已驳回</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--danger)' }}>{rejectedCount}</div>
          </div>
        </div>

        <h2 className="section-title">我的使用统计(过去30天)</h2>
        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>各设施预约次数</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="facilityName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalBookings" name="预约次数" fill="#4A6FA5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>各设施使用率(%)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="facilityName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilizationRate" name="使用率%" fill="#48BB78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>每日预约趋势</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="预约数"
                    stroke="#4A6FA5"
                    strokeWidth={2}
                    dot={{ fill: '#4A6FA5', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ animation: `${view} 0.3s ease` }}>
          {filteredBookings.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p className="text-muted">暂无预约记录</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                去预约
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map((b) => {
                const facility = getFacility(b.facilityId);
                const isExpanded = expandedId === b.id;
                const isFlipped = flippedId === b.id;
                const isPast = isBefore(parseISO(b.startTime), new Date()) && !isToday(parseISO(b.startTime));

                return (
                  <div
                    key={b.id}
                    className={`card`}
                    style={{
                      padding: '20px',
                      animation: 'slideInLeft 0.3s ease',
                    }}
                  >
                    {!isFlipped ? (
                      <>
                        <div
                          className="flex-between"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{ fontSize: '28px' }}>{facility?.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{facility?.name}</h3>
                                {getStatusBadge(b.status)}
                              </div>
                              <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                                📅 {formatDateTime(parseISO(b.startTime))} - {format(parseISO(b.endTime), 'HH:mm')}
                              </p>
                            </div>
                            <span style={{ fontSize: '18px', color: 'var(--text-secondary)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                              <div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>预约用途</div>
                                <div style={{ fontSize: '14px' }}>{b.purpose}</div>
                              </div>
                              <div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>使用人数</div>
                                <div style={{ fontSize: '14px' }}>{b.peopleCount} 人</div>
                              </div>
                              <div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>提交时间</div>
                                <div style={{ fontSize: '14px' }}>{formatDateTime(parseISO(b.createdAt))}</div>
                              </div>
                              <div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>状态更新</div>
                                <div style={{ fontSize: '14px' }}>{formatDateTime(parseISO(b.updatedAt))}</div>
                              </div>
                            </div>

                            {b.status === 'rejected' && (
                              <div style={{ marginTop: '16px' }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setFlippedId(b.id)}
                                >
                                  查看驳回原因 →
                                </button>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                              {b.status === 'pending' && !isPast && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(b.id)}
                                >
                                  取消预约
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          animation: 'fadeIn 0.3s ease',
                        }}
                      >
                        <div className="flex-between" style={{ marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger)' }}>
                            ❌ 预约已驳回
                          </h3>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setFlippedId(null)}
                          >
                            ← 返回
                          </button>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--danger-light)', borderRadius: '8px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#742A2A', marginBottom: '6px' }}>驳回理由：</div>
                          <div style={{ fontSize: '14px', color: '#742A2A' }}>{b.rejectReason}</div>
                        </div>

                        {b.rejectSuggestion && (
                          <div style={{ padding: '16px', background: 'var(--warning-light)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#744210', marginBottom: '6px' }}>修改建议：</div>
                            <div style={{ fontSize: '14px', color: '#744210' }}>{b.rejectSuggestion}</div>
                          </div>
                        )}

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                          <Link to="/" className="btn btn-primary btn-sm">
                            重新预约
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
