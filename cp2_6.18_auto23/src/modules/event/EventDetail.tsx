import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useEventStore } from '../../store/eventStore';
import { formatDate, formatTime } from '../../utils/helpers';
import './EventDetail.css';

interface EventDetailProps {
  eventId: string;
  onBack: () => void;
}

function EventDetail({ eventId, onBack }: EventDetailProps) {
  const { getEventById, registerEvent, loading } = useEventStore();
  const event = getEventById(eventId);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    participantCount: 1,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusConfig = useMemo(() => {
    const configs = {
      upcoming: { text: '即将开始', color: '#3B82F6', bgColor: '#EFF6FF' },
      ongoing: { text: '进行中', color: '#10B981', bgColor: '#ECFDF5' },
      ended: { text: '已结束', color: '#9CA3AF', bgColor: '#F3F4F6' },
    };
    return event ? configs[event.status] : configs.upcoming;
  }, [event]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !event) return;

    setIsSubmitting(true);
    try {
      await registerEvent(eventId, formData);
      setShowSuccessModal(true);
      setFormData({ name: '', email: '', phone: '', participantCount: 1 });
    } catch (error) {
      console.error('报名失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
  };

  if (!event) {
    return (
      <div className="event-detail-page">
        <button className="back-btn" onClick={onBack}>
          ← 返回列表
        </button>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载活动详情...</p>
        </div>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!event) return [];
    return event.registrationTrend.slice(-14);
  }, [event]);

  return (
    <div className="event-detail-page">
      <button className="back-btn" onClick={onBack}>
        ← 返回列表
      </button>

      <div
        className="status-banner"
        style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
      >
        <span className={`status-dot ${event.status === 'ongoing' ? 'pulse' : ''}`}></span>
        {statusConfig.text}
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div
            className="detail-cover"
            style={{ background: `linear-gradient(135deg, ${event.coverColor}, ${event.coverColor}dd)` }}
          >
            <div className="detail-cover-pattern">
              <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="20" fill="rgba(255,255,255,0.1)" />
                <circle cx="160" cy="70" r="30" fill="rgba(255,255,255,0.08)" />
                <path d="M10 80 Q100 40 190 80" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
                <circle cx="100" cy="40" r="15" fill="rgba(255,255,255,0.1)" />
              </svg>
            </div>
            <div className="detail-cover-content">
              <h1 className="detail-title">{event.title}</h1>
              <div className="detail-meta-row">
                <div className="detail-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                </div>
                <div className="detail-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>

          <section className="detail-section">
            <h2 className="section-title">活动介绍</h2>
            <p className="detail-description">{event.description}</p>
          </section>

          <section className="detail-section">
            <h2 className="section-title">日程安排</h2>
            <div className="timeline">
              {event.schedule.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-time">
                    <span className="time-date">{formatDate(item.time)}</span>
                    <span className="time-hour">{formatTime(item.time)}</span>
                  </div>
                  <div className="timeline-line">
                    <div className="timeline-dot"></div>
                  </div>
                  <div className="timeline-content">
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">活动地点</h2>
            <div className="location-map">
              <div className="map-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p>{event.location}</p>
                <span>地图位置占位</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">报名趋势</h2>
            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C63FF" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => {
                        const parts = value.split('-');
                        return `${parts[1]}/${parts[2]}`;
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        padding: '12px 16px',
                        minWidth: '120px',
                      }}
                      labelStyle={{ color: '#1F2937', fontWeight: 600, marginBottom: '6px' }}
                      formatter={(value: number) => [`${value} 人`, '报名人数']}
                      itemStyle={{ color: '#6C63FF', fontWeight: 500 }}
                      cursor={{ stroke: '#6C63FF', strokeDasharray: '5 5', strokeOpacity: 0.5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6C63FF"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      dot={{ r: 4, fill: '#6C63FF', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 7, fill: '#6C63FF', strokeWidth: 3, stroke: '#FFFFFF' }}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  <p>暂无报名数据</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="registration-panel">
          <div className="panel-sticky">
            <h2 className="panel-title">立即报名</h2>

            <div className="panel-stats">
              <div className="stat-item">
                <span className="stat-number">{event.registrationCount}</span>
                <span className="stat-label">已报名</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{event.capacity}</span>
                <span className="stat-label">总名额</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">
                  {Math.max(0, event.capacity - event.registrationCount)}
                </span>
                <span className="stat-label">剩余名额</span>
              </div>
            </div>

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">姓名</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="请输入您的姓名"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="请输入您的邮箱"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="请输入您的手机号"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">参加人数</label>
                <input
                  type="number"
                  name="participantCount"
                  className="form-input"
                  min="1"
                  max="10"
                  value={formData.participantCount}
                  onChange={handleInputChange}
                />
              </div>

              <button
                type="submit"
                className="btn-primary submit-btn"
                disabled={isSubmitting || event.status === 'ended'}
              >
                {isSubmitting ? '提交中...' : event.status === 'ended' ? '活动已结束' : '确认报名'}
              </button>
            </form>

            <p className="panel-tip">
              * 报名成功后，我们将通过邮件发送活动详情
            </p>
          </div>
        </aside>
      </div>

      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="modal-title">报名成功！</h3>
            <p className="modal-desc">
              您已成功报名 <strong>{event.title}</strong>，活动详情已发送至您的邮箱。
            </p>
            <button className="btn-primary modal-close-btn" onClick={closeModal}>
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetail;
