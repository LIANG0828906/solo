import { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ActivityContext } from '../../App';
import type { Activity, Registration } from '../../types';

const LOCATION_SUGGESTIONS = [
  '城市图书馆三楼阅读室',
  '滨江公园南门广场',
  '社区活动中心多功能厅',
  '青年创业孵化器路演厅',
  '市政公园中央草坪',
  '大学校园报告厅A',
  '科技创新大厦会议室301',
  '文化艺术中心小剧场',
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActivityList = () => {
  const navigate = useNavigate();
  const { setCurrentActivityId } = useContext(ActivityContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setActivities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCardClick = (id: string) => {
    setCurrentActivityId(id);
    navigate(`/activity/${id}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>活动管理</h2>
          <div className="subtitle">创建和管理您的活动</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 创建活动
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3>暂无活动</h3>
          <p>点击上方按钮创建您的第一个活动</p>
        </div>
      ) : (
        <div className="activity-grid">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="activity-card"
              onClick={() => handleCardClick(activity.id)}
            >
              <span className="card-badge">{activity.isPublic ? '公开' : '私密'}</span>
              <h3>{activity.name}</h3>
              <div className="card-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {formatDate(activity.dateTime)}
              </div>
              <div className="card-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {activity.location}
              </div>
              <div className="card-footer">
                <div className="count">
                  限 <strong>{activity.maxParticipants}</strong> 人
                </div>
                <div className="count">
                  截止 {new Date(activity.registrationDeadline).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateActivityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchActivities();
          }}
        />
      )}
    </div>
  );
};

const CreateActivityModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  const filteredSuggestions = LOCATION_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(location.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('请输入活动名称');
    if (name.length > 30) return setError('活动名称最多30字');
    if (!dateTime) return setError('请选择活动时间');
    if (!location.trim()) return setError('请输入活动地点');
    if (!registrationDeadline) return setError('请选择报名截止时间');

    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dateTime: new Date(dateTime).toISOString(),
          location: location.trim(),
          maxParticipants,
          registrationDeadline: new Date(registrationDeadline).toISOString(),
          isPublic,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '创建失败');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>创建新活动</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>活动名称（最多30字）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="输入活动名称"
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {name.length}/30
            </div>
          </div>

          <div className="input-group">
            <label>活动日期时间</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              style={{
                colorScheme: 'dark',
              }}
            />
          </div>

          <div className="input-group">
            <label>活动地点</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="输入地点或选择推荐"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="autocomplete-list">
                  {filteredSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="autocomplete-item"
                      onMouseDown={() => {
                        setLocation(s);
                        setShowSuggestions(false);
                      }}
                    >
                      📍 {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="slider-container">
            <label>
              <span>最大参与人数</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{maxParticipants} 人</span>
            </label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
            />
          </div>

          <div className="input-group">
            <label>报名截止时间</label>
            <input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
            />
            <label htmlFor="public" style={{ marginBottom: 0 }}>
              公开活动（所有人可见）
            </label>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建活动
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentActivityId } = useContext(ActivityContext);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<Registration | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [actRes, regRes] = await Promise.all([
        fetch(`/api/activity/${id}`),
        fetch(`/api/activity/${id}/registrations`),
      ]);
      const act = await actRes.json();
      const reg = await regRes.json();
      setActivity(act);
      setRegistrations(reg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) setCurrentActivityId(id);
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除此活动吗？')) return;
    await fetch(`/api/activity/${id}`, { method: 'DELETE' });
    navigate('/activity');
  };

  const handleRegisterSuccess = (reg: Registration) => {
    setRegisteredUser(reg);
    setShowRegisterForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    fetchData();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!activity) {
    return <div>活动不存在</div>;
  }

  return (
    <div className="activity-detail">
      <div style={{ marginBottom: 24 }}>
        <Link to="/activity" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }}>
          ← 返回活动列表
        </Link>
      </div>

      <div className="activity-detail-hero">
        <h1>{activity.name}</h1>
        <div className="activity-detail-info">
          <div className="info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <div className="info-label">活动时间</div>
              <div className="info-value">{formatDate(activity.dateTime)}</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <div className="info-label">活动地点</div>
              <div className="info-value">{activity.location}</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <div className="info-label">参与人数</div>
              <div className="info-value">
                {registrations.length} / {activity.maxParticipants}
              </div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <div className="info-label">报名截止</div>
              <div className="info-value">{formatDate(activity.registrationDeadline)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button className="btn btn-primary" onClick={() => setShowRegisterForm(true)}>
          立即报名
        </button>
        <Link to={`/attendance`} style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary">开始签到</button>
        </Link>
        <Link to={`/attendance/display`} style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary">签到大屏</button>
        </Link>
        <button className="btn btn-danger" onClick={handleDelete}>
          删除活动
        </button>
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>报名列表（{registrations.length}人）</h3>
        {registrations.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <h3>暂无报名</h3>
          </div>
        ) : (
          <table className="participants-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>手机号</th>
                <th>报名时间</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{formatDate(r.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRegisterForm && activity.id && (
        <RegisterFormModal
          activityId={activity.id}
          activityName={activity.name}
          onClose={() => setShowRegisterForm(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {registeredUser && (
        <QRCodeModal
          registration={registeredUser}
          activityName={activity.name}
          onClose={() => setRegisteredUser(null)}
        />
      )}

      {showSuccess && (
        <div className="toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          报名成功！请保存您的二维码
        </div>
      )}
    </div>
  );
};

const RegisterFormModal = ({
  activityId,
  activityName,
  onClose,
  onSuccess,
}: {
  activityId: string;
  activityName: string;
  onClose: () => void;
  onSuccess: (r: Registration) => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('请输入姓名');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('请输入有效邮箱');
    if (!/^1[3-9]\d{9}$/.test(phone)) return setError('请输入有效手机号');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/activity/${activityId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const data = await res.json();
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>活动报名</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{activityName}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>姓名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入您的姓名" />
          </div>
          <div className="input-group">
            <label>邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
          </div>
          <div className="input-group">
            <label>手机号</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138xxxxxxxx" />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '提交报名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const QRCodeModal = ({
  registration,
  activityName,
  onClose,
}: {
  registration: Registration;
  activityName: string;
  onClose: () => void;
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>报名成功</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="qr-display">
          <div className="qr-wrapper">
            <QRCodeSVG value={registration.qrCode} size={160} level="H" includeMargin={false} />
            <div className="logo-overlay">ES</div>
          </div>
          <div className="qr-info">
            <h4>{registration.name}</h4>
            <p>{activityName}</p>
            <p style={{ marginTop: 8, fontSize: 12 }}>请在活动当天出示此二维码签到</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicActivityList = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch('/api/activity/public');
        const data = await res.json();
        setActivities(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>公开活动</h2>
          <div className="subtitle">浏览并报名感兴趣的活动</div>
        </div>
      </div>
      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h3>暂无公开活动</h3>
        </div>
      ) : (
        <div className="activity-grid">
          {activities.map((a) => (
            <div key={a.id} className="activity-card" onClick={() => navigate(`/activity/${a.id}`)}>
              <span className="card-badge">公开</span>
              <h3>{a.name}</h3>
              <div className="card-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {formatDate(a.dateTime)}
              </div>
              <div className="card-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {a.location}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityModule = () => {
  return (
    <Routes>
      <Route path="/" element={<ActivityList />} />
      <Route path="/public" element={<PublicActivityList />} />
      <Route path="/:id" element={<ActivityDetail />} />
    </Routes>
  );
};

export default ActivityModule;
