import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

type Role = 'patient' | 'doctor' | 'owner';

interface UserInfo {
  id: number;
  role: Role;
  name: string;
}

interface ScheduleItem {
  id: number;
  doctorId: number;
  doctorName: string;
  dayOfWeek: number;
  timeSlot: 'morning' | 'afternoon';
  totalSlots: number;
  bookedSlots: number;
}

interface Appointment {
  id: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  scheduleId: number;
  date: string;
  timeSlot: 'morning' | 'afternoon';
  status: 'pending' | 'in-progress' | 'completed';
}

interface Message {
  id: number;
  appointmentId: string;
  senderId: number;
  senderRole: 'patient' | 'doctor';
  content: string;
  timestamp: string;
}

interface Herb {
  id: number;
  name: string;
  nature: '温' | '热' | '寒' | '凉' | '平';
  flavor: '辛' | '甘' | '酸' | '苦' | '咸';
  defaultDosage: string;
  processing: string;
  stock: number;
}

interface PrescriptionItem {
  herbId: number;
  herbName: string;
  dosage: number;
  unit: string;
  processing: string;
}

interface Prescription {
  id: number;
  appointmentId: string;
  doctorId: number;
  items: PrescriptionItem[];
  status: '待抓' | '称药中' | '分装中' | '煎煮中' | '已完成';
  createdAt: string;
}

const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');
const setToken = (t: string) => localStorage.setItem('token', t);
const clearToken = () => localStorage.removeItem('token');

const apiRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data as T;
};

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const STATUS_ORDER: Prescription['status'][] = ['待抓', '称药中', '分装中', '煎煮中', '已完成'];

function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username: string, password: string) => {
    const res = await apiRequest<{ token: string; user: UserInfo }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setToken(res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (username: string, password: string, name: string) => {
    const res = await apiRequest<{ token: string; user: UserInfo }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name })
    });
    setToken(res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, register, logout };
}

function Navbar({ user, onLogout, currentPath }: { user: UserInfo; onLogout: () => void; currentPath: string }) {
  const navigate = useNavigate();
  const roleText = { patient: '患者', doctor: '大夫', owner: '掌柜' }[user.role];

  const links = (() => {
    if (user.role === 'patient') {
      return [
        { path: '/appointment', label: '挂号' },
        { path: '/consultation', label: '问诊' },
        { path: '/progress', label: '抓药进度' },
      ];
    }
    if (user.role === 'doctor') {
      return [
        { path: '/consultation', label: '问诊室' },
        { path: '/prescription', label: '开处方' },
      ];
    }
    return [
      { path: '/progress', label: '抓药进度' },
      { path: '/pharmacy', label: '药房管理' },
    ];
  })();

  return (
    <nav className="navbar">
      <div className="nav-brand">🏥 古代医馆</div>
      <div className="nav-links">
        {links.map(l => (
          <button
            key={l.path}
            className={`nav-link ${currentPath === l.path ? 'active' : ''}`}
            onClick={() => navigate(l.path)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="user-section">
        <span className="user-info">
          {user.name}<span className="role-badge">{roleText}</span>
        </span>
        <button className="btn" onClick={onLogout}>退出</button>
      </div>
    </nav>
  );
}

function LoginPage({ onLogin, onRegister }: { onLogin: (u: UserInfo) => void; onRegister: (u: UserInfo) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const user = await (window as any).__auth?.login(username, password) || 
          (await apiRequest<{ token: string; user: UserInfo }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
          })).user;
        onLogin(user);
      } else {
        if (!name.trim()) { setError('请输入姓名'); return; }
        const user = await (window as any).__auth?.register(username, password, name) ||
          (await apiRequest<{ token: string; user: UserInfo }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, name })
          })).user;
        onRegister(user);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container page-fade">
      <div className="card">
        <h2 className="page-title" style={{ marginBottom: 15 }}>
          {mode === 'login' ? '登录医馆' : '注册账号'}
        </h2>
        <div className="tab-bar" style={{ justifyContent: 'center' }}>
          <button
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >登录</button>
          <button
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >注册</button>
        </div>
        {error && <div style={{ color: '#C0392B', textAlign: 'center', marginBottom: 15 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="请输入真实姓名"
              />
            </div>
          )}
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
        <div style={{ marginTop: 20, fontSize: 12, color: '#888', textAlign: 'center' }}>
          <p>测试账号：</p>
          <p>patient1 / 123456（患者）| doctor1 / 123456（大夫）| owner / 123456（掌柜）</p>
        </div>
      </div>
    </div>
  );
}

function AppointmentPage({ user }: { user: UserInfo }) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ schedules: ScheduleItem[]; weekDates: string[] }>('/schedules');
        setSchedules(data.schedules);
        setWeekDates(data.weekDates);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBook = async (schedule: ScheduleItem) => {
    try {
      const data = await apiRequest<{ appointment: Appointment }>('/appointments', {
        method: 'POST',
        body: JSON.stringify({ scheduleId: schedule.id })
      });
      setSelectedAppt(data.appointment);
      setShowModal(true);
      setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, bookedSlots: s.bookedSlots + 1 } : s));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderCell = (day: number, slot: 'morning' | 'afternoon') => {
    const cellSchedules = schedules.filter(s => s.dayOfWeek === day && s.timeSlot === slot);
    const allFull = cellSchedules.length > 0 && cellSchedules.every(s => s.bookedSlots >= s.totalSlots);
    return (
      <div className={`schedule-cell ${allFull ? 'full' : ''}`}>
        {cellSchedules.map(s => {
          const isFull = s.bookedSlots >= s.totalSlots;
          return (
            <div
              key={s.id}
              className={`doctor-slot ${isFull ? 'full' : ''}`}
              onClick={() => !isFull && handleBook(s)}
            >
              <div className="name">{s.doctorName}</div>
              <div className="slots">余 {s.totalSlots - s.bookedSlots}/{s.totalSlots} 号</div>
            </div>
          );
        })}
        {cellSchedules.length === 0 && <div style={{ color: '#bbb', fontSize: 11, textAlign: 'center' }}>无坐诊</div>}
      </div>
    );
  };

  return (
    <div className="page-fade">
      <h1 className="page-title">📅 本周大夫坐诊时间表</h1>
      {loading ? (
        <div className="card" style={{ textAlign: 'center' }}>加载中...</div>
      ) : (
        <>
          <div className="schedule-grid">
            <div className="schedule-header">时段</div>
            {WEEK_DAYS.map((d, i) => (
              <div key={d} className="schedule-header">
                {d}
                <div style={{ fontSize: 11, opacity: 0.8 }}>{weekDates[i] || ''}</div>
              </div>
            ))}
            <div className="schedule-time">上午<br />08:00-12:00</div>
            {[1, 2, 3, 4, 5, 6, 7].map(d => <div key={`am${d}`}>{renderCell(d, 'morning')}</div>)}
            <div className="schedule-time">下午<br />14:00-18:00</div>
            {[1, 2, 3, 4, 5, 6, 7].map(d => <div key={`pm${d}`}>{renderCell(d, 'afternoon')}</div>)}
          </div>
        </>
      )}

      {showModal && selectedAppt && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="prescription-paper">
              <div className="prescription-header">
                <div className="prescription-title">挂 号 单</div>
              </div>
              <div className="prescription-body">
                <div className="prescription-info">
                  <div className="info-row"><span className="info-label">挂号编号：</span><strong>{selectedAppt.id}</strong></div>
                  <div className="info-row"><span className="info-label">患者姓名：</span>{selectedAppt.patientName}</div>
                  <div className="info-row"><span className="info-label">就诊大夫：</span>{selectedAppt.doctorName}</div>
                  <div className="info-row"><span className="info-label">就诊日期：</span>{selectedAppt.date}</div>
                  <div className="info-row"><span className="info-label">就诊时段：</span>{selectedAppt.timeSlot === 'morning' ? '上午' : '下午'}</div>
                </div>
                <div className="prescription-herbs">
                  医者仁心 悬壶济世
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowModal(false)}>关闭</button>
              <button className="btn btn-primary" onClick={() => { setShowModal(false); navigate('/consultation'); }}>
                进入问诊
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConsultationScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    let start = Date.now();

    const draw = () => {
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      const t = (Date.now() - start) / 1000;

      ctx.clearRect(0, 0, w, h);

      const floorGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
      floorGrad.addColorStop(0, '#8B5A2B');
      floorGrad.addColorStop(1, '#6B4423');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);

      for (let i = 0; i < 10; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        const y = h * 0.6 + (i * h * 0.04);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (i % 2 ? 5 : -5));
        ctx.stroke();
      }

      const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      wallGrad.addColorStop(0, '#F5E6C8');
      wallGrad.addColorStop(1, '#E8D4A8');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h * 0.6);

      const deskX = w * 0.1;
      const deskY = h * 0.45;
      const deskW = w * 0.25;
      const deskH = h * 0.18;

      ctx.fillStyle = '#5C3A1D';
      ctx.fillRect(deskX + 10, deskY + deskH - 5, 15, h * 0.14);
      ctx.fillRect(deskX + deskW - 25, deskY + deskH - 5, 15, h * 0.14);

      const tableGrad = ctx.createLinearGradient(deskX, deskY, deskX, deskY + deskH);
      tableGrad.addColorStop(0, '#B8744D');
      tableGrad.addColorStop(0.5, '#A0522D');
      tableGrad.addColorStop(1, '#8B4513');
      ctx.fillStyle = tableGrad;
      ctx.beginPath();
      ctx.roundRect(deskX, deskY, deskW, deskH, [8, 8, 4, 4]);
      ctx.fill();

      ctx.strokeStyle = '#6B3410';
      ctx.lineWidth = 2;
      ctx.strokeRect(deskX + 5, deskY + 5, deskW - 10, deskH - 10);

      ctx.fillStyle = '#F5F0D7';
      ctx.fillRect(deskX + 30, deskY + 15, 50, 35);
      ctx.strokeStyle = '#C0392B';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(deskX + 30, deskY + 15, 50, 35);
      ctx.fillStyle = '#333';
      ctx.font = '10px KaiTi';
      ctx.fillText('脉案', deskX + 40, deskY + 35);

      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(deskX + deskW - 50, deskY + 30, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6B3410';
      ctx.fillRect(deskX + deskW - 65, deskY + 20, 30, 5);

      const winX = w * 0.62;
      const winY = h * 0.08;
      const winW = w * 0.28;
      const winH = h * 0.45;

      ctx.fillStyle = '#6B3410';
      ctx.fillRect(winX - 8, winY - 8, winW + 16, winH + 16);

      ctx.save();
      ctx.beginPath();
      ctx.rect(winX, winY, winW, winH);
      ctx.clip();

      const skyGrad = ctx.createLinearGradient(0, winY, 0, winY + winH);
      skyGrad.addColorStop(0, '#E8F4F8');
      skyGrad.addColorStop(1, '#A8D5A5');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(winX, winY, winW, winH);

      ctx.fillStyle = '#7EB87C';
      ctx.beginPath();
      ctx.moveTo(winX, winY + winH);
      ctx.quadraticCurveTo(winX + winW * 0.3, winY + winH * 0.5, winX + winW * 0.5, winY + winH * 0.7);
      ctx.quadraticCurveTo(winX + winW * 0.7, winY + winH * 0.9, winX + winW, winY + winH * 0.6);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.closePath();
      ctx.fill();

      const sway = Math.sin(t * Math.PI / 2) * 3 * Math.PI / 180;

      const drawBamboo = (cx: number, baseY: number, height: number, color: string) => {
        ctx.save();
        ctx.translate(cx, baseY);
        ctx.rotate(sway * (cx % 2 ? 1 : -1));

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -height);
        ctx.stroke();

        for (let i = 1; i <= 5; i++) {
          const nodeY = -height * (i / 6);
          ctx.strokeStyle = '#4A7C4A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-5, nodeY);
          ctx.lineTo(5, nodeY);
          ctx.stroke();
        }

        const leafPositions = [
          { x: 8, y: -height * 0.2, a: 0.4, l: 30 },
          { x: -6, y: -height * 0.35, a: -0.5, l: 28 },
          { x: 10, y: -height * 0.5, a: 0.3, l: 32 },
          { x: -8, y: -height * 0.65, a: -0.4, l: 26 },
          { x: 5, y: -height * 0.85, a: 0.2, l: 22 },
        ];

        ctx.fillStyle = '#5A9A5A';
        leafPositions.forEach(lp => {
          ctx.save();
          ctx.translate(lp.x, lp.y);
          ctx.rotate(lp.a);
          ctx.beginPath();
          ctx.ellipse(0, -lp.l / 2, 4, lp.l / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        ctx.restore();
      };

      drawBamboo(winX + winW * 0.2, winY + winH, winH * 0.85, '#4A8C4A');
      drawBamboo(winX + winW * 0.45, winY + winH + 10, winH * 0.75, '#3A7C3A');
      drawBamboo(winX + winW * 0.7, winY + winH + 5, winH * 0.8, '#5A9A5A');
      drawBamboo(winX + winW * 0.88, winY + winH + 15, winH * 0.7, '#4A8C4A');

      ctx.restore();

      ctx.strokeStyle = '#6B3410';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(winX + winW / 2, winY);
      ctx.lineTo(winX + winW / 2, winY + winH);
      ctx.moveTo(winX, winY + winH / 2);
      ctx.lineTo(winX + winW, winY + winH / 2);
      ctx.stroke();

      const drawCarving = (x: number, y: number, size: number) => {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const px = x + Math.cos(angle) * size;
          const py = y + Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };

      [
        [winX + 15, winY + 15], [winX + winW - 15, winY + 15],
        [winX + 15, winY + winH - 15], [winX + winW - 15, winY + winH - 15]
      ].forEach(([x, y]) => drawCarving(x, y, 8));

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}

function ConsultationPage({ user }: { user: UserInfo }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(0);

  useEffect(() => {
    (async () => {
      const data = await apiRequest<Appointment[]>('/appointments/my');
      setAppointments(data);
      if (data.length > 0) setSelectedAppt(data[0]);
    })();
  }, []);

  useEffect(() => {
    if (!selectedAppt) return;
    (async () => {
      const data = await apiRequest<Message[]>(`/messages/${selectedAppt.id}`);
      setMessages(data);
    })();
  }, [selectedAppt?.id]);

  useEffect(() => {
    if (messages.length > 0 && messages.length - msgCountRef.current >= 5) {
      msgCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedAppt) return;
    try {
      const msg = await apiRequest<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify({ appointmentId: selectedAppt.id, content: input.trim() })
      });
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-fade consultation-container">
      <h1 className="page-title">🏮 问诊室</h1>
      
      <ConsultationScene />

      {user.role === 'doctor' && (
        <div className="card">
          <h3 style={{ color: '#A0522D', marginBottom: 15 }}>今日接诊患者</h3>
          {appointments.length === 0 ? (
            <div style={{ color: '#999' }}>暂无预约患者</div>
          ) : (
            <div className="doctor-panel">
              {appointments.map(a => (
                <div
                  key={a.id}
                  className={`card patient-card ${selectedAppt?.id === a.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAppt(a)}
                >
                  <div style={{ fontWeight: 'bold', color: '#C0392B' }}>{a.patientName}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>编号: {a.id}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{a.date} {a.timeSlot === 'morning' ? '上午' : '下午'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user.role === 'patient' && appointments.length > 0 && (
        <div className="card">
          <h3 style={{ color: '#A0522D', marginBottom: 15 }}>我的预约</h3>
          <div className="doctor-panel">
            {appointments.map(a => (
              <div
                key={a.id}
                className={`card patient-card ${selectedAppt?.id === a.id ? 'selected' : ''}`}
                onClick={() => setSelectedAppt(a)}
              >
                <div style={{ fontWeight: 'bold', color: '#C0392B' }}>{a.doctorName} 大夫</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>编号: {a.id}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{a.date} {a.timeSlot === 'morning' ? '上午' : '下午'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              {selectedAppt ? '开始问诊吧...' : (user.role === 'patient' ? '请先挂号预约' : '请选择接诊患者')}
            </div>
          )}
          {messages.map(m => {
            const isPatient = m.senderRole === 'patient';
            const senderName = isPatient ? (user.role === 'patient' ? '我' : selectedAppt?.patientName) : (user.role === 'doctor' ? '我' : selectedAppt?.doctorName);
            return (
              <div key={m.id} className={`chat-bubble ${m.senderRole}`}>
                <div className="sender">{senderName}</div>
                <div>{m.content}</div>
                <div className="time">{new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder={selectedAppt ? '输入消息，按回车发送...' : '请先选择预约'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!selectedAppt}
          />
          <button className="btn btn-primary" onClick={sendMessage} disabled={!selectedAppt}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function PrescriptionPage({ user }: { user: UserInfo }) {
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['温性', '甘味']));
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    (async () => {
      const [h, a] = await Promise.all([
        apiRequest<Herb[]>('/herbs'),
        user.role === 'doctor' ? apiRequest<Appointment[]>('/appointments/my') : Promise.resolve([] as Appointment[])
      ]);
      setHerbs(h);
      setAppointments(a);
      if (a.length > 0) setSelectedAppt(a[0]);
    })();
  }, [user.role]);

  const groupedByNature = herbs.reduce<Record<string, Herb[]>>((acc, h) => {
    const key = `${h.nature}性`;
    (acc[key] ||= []).push(h);
    return acc;
  }, {});

  const groupedByFlavor = herbs.reduce<Record<string, Herb[]>>((acc, h) => {
    const key = `${h.flavor}味`;
    (acc[key] ||= []).push(h);
    return acc;
  }, {});

  const toggleCat = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, herb: Herb) => {
    e.dataTransfer.setData('herb', JSON.stringify(herb));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const herb: Herb = JSON.parse(e.dataTransfer.getData('herb'));
      const dosageNum = parseInt(herb.defaultDosage) || 10;
      const unit = herb.defaultDosage.replace(/^\d+/, '') || 'g';

      setPrescription(prev => {
        const idx = prev.findIndex(p => p.herbId === herb.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], dosage: next[idx].dosage + dosageNum };
          return next;
        }
        return [...prev, {
          herbId: herb.id,
          herbName: herb.name,
          dosage: dosageNum,
          unit,
          processing: herb.processing
        }];
      });
    } catch {}
  };

  const updateItem = (idx: number, field: 'dosage' | 'processing', value: string) => {
    setPrescription(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'dosage' ? parseFloat(value) || 0 : value };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setPrescription(prev => prev.filter((_, i) => i !== idx));
  };

  const submitPrescription = async () => {
    if (!selectedAppt) { alert('请选择患者'); return; }
    if (prescription.length === 0) { alert('请添加药材'); return; }
    try {
      await apiRequest('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({ appointmentId: selectedAppt.id, items: prescription })
      });
      alert('处方已提交，药房正在抓药');
      setPrescription([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderCategory = (title: string, items: Herb[]) => {
    const open = openCategories.has(title);
    return (
      <div key={title} className="herb-category">
        <div className={`category-header ${open ? 'open' : ''}`} onClick={() => toggleCat(title)}>
          <span>{title} ({items.length})</span>
          <span className={`category-icon ${open ? 'open' : ''}`}>▼</span>
        </div>
        {open && (
          <div className="herb-list">
            {items.map(h => (
              <div
                key={h.id}
                className="herb-item"
                draggable
                onDragStart={e => handleDragStart(e, h)}
              >
                <div className="herb-name">{h.name}</div>
                <div className="herb-dosage">{h.defaultDosage}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-fade">
      <h1 className="page-title">📜 开处方</h1>

      {user.role === 'doctor' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#A0522D', marginBottom: 15 }}>选择患者</h3>
          {appointments.length === 0 ? (
            <div style={{ color: '#999' }}>暂无患者，请到问诊室接诊</div>
          ) : (
            <div className="doctor-panel">
              {appointments.map(a => (
                <div
                  key={a.id}
                  className={`card patient-card ${selectedAppt?.id === a.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAppt(a)}
                >
                  <div style={{ fontWeight: 'bold', color: '#C0392B' }}>{a.patientName}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>编号: {a.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="prescription-page">
        <div className="herb-library card">
          <h3 style={{ color: '#A0522D', marginBottom: 15 }}>📦 药材库（拖拽至处方笺）</h3>
          <div style={{ marginBottom: 10, fontSize: 13, color: '#666' }}>按四性分类：</div>
          {Object.entries(groupedByNature).map(([k, v]) => renderCategory(k, v))}
          <div style={{ margin: '15px 0 10px', fontSize: 13, color: '#666' }}>按五味分类：</div>
          {Object.entries(groupedByFlavor).map(([k, v]) => renderCategory(k, v))}
        </div>

        <div
          className={`prescription-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="prescription-title-area">
            <h2 style={{ color: '#C0392B', letterSpacing: 4 }}>处 方 笺</h2>
            {selectedAppt && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                患者：{selectedAppt.patientName} | 编号：{selectedAppt.id}
              </div>
            )}
          </div>

          <div className="prescription-items">
            {prescription.length === 0 ? (
              <div className="empty-prescription">
                👆 将左侧药材拖拽至此处开方<br />
                <span style={{ fontSize: 12 }}>相同药材会自动合并用量</span>
              </div>
            ) : (
              prescription.map((item, idx) => (
                <div key={`${item.herbId}-${idx}`} className="prescription-item-row">
                  <span className="name">{item.herbName}</span>
                  <input
                    type="number"
                    value={item.dosage}
                    onChange={e => updateItem(idx, 'dosage', e.target.value)}
                    min="0"
                    step="0.5"
                  />
                  <input
                    type="text"
                    value={item.processing}
                    onChange={e => updateItem(idx, 'processing', e.target.value)}
                    placeholder="炮制"
                  />
                  <button className="remove-btn" onClick={() => removeItem(idx)} title="移除">×</button>
                </div>
              ))
            )}
          </div>

          <div className="prescription-footer">
            <div style={{ color: '#666' }}>
              共 {prescription.length} 味药
              {prescription.length > 0 && ` | 总量 ${prescription.reduce((s, i) => s + i.dosage, 0)}g`}
            </div>
            <button
              className="btn btn-primary"
              onClick={submitPrescription}
              disabled={prescription.length === 0 || !selectedAppt}
            >
              提交处方
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressPage({ user }: { user: UserInfo }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>('');
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);

  const loadData = useCallback(async () => {
    try {
      const appts = await apiRequest<Appointment[]>('/appointments/my');
      setAppointments(appts);
      
      if (user.role === 'owner') {
        const dash = await apiRequest<{ prescriptions: Prescription[] }>('/pharmacy/dashboard');
        setAllPrescriptions(dash.prescriptions);
        if (dash.prescriptions.length > 0 && !selectedApptId) {
          setSelectedApptId(dash.prescriptions[0].appointmentId);
        }
      } else if (appts.length > 0 && !selectedApptId) {
        setSelectedApptId(appts[0].id);
      }
    } catch {}
  }, [user.role, selectedApptId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!selectedApptId) return;
    (async () => {
      const p = await apiRequest<Prescription | null>(`/prescriptions/${selectedApptId}`);
      setPrescription(p);
    })();
  }, [selectedApptId]);

  const advanceStatus = async () => {
    if (!prescription || prescription.status === '已完成') return;
    const idx = STATUS_ORDER.indexOf(prescription.status);
    const next = STATUS_ORDER[idx + 1];
    try {
      await apiRequest(`/prescriptions/${prescription.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: next })
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const displayPrescriptions = user.role === 'owner' ? allPrescriptions : appointments;

  return (
    <div className="page-fade progress-container">
      <h1 className="page-title">⚗️ 药房抓药进度</h1>

      <div className="card" style={{ marginBottom: 30 }}>
        <h3 style={{ color: '#A0522D', marginBottom: 15 }}>
          {user.role === 'owner' ? '所有处方' : '我的处方'}
        </h3>
        {displayPrescriptions.length === 0 ? (
          <div style={{ color: '#999' }}>暂无处方记录</div>
        ) : (
          <div className="doctor-panel">
            {displayPrescriptions.map((item: any) => {
              const apptId = user.role === 'owner' ? item.appointmentId : item.id;
              const isOwner = user.role === 'owner';
              return (
                <div
                  key={apptId}
                  className={`card patient-card ${selectedApptId === apptId ? 'selected' : ''}`}
                  onClick={() => setSelectedApptId(apptId)}
                >
                  <div style={{ fontWeight: 'bold', color: '#C0392B' }}>
                    {isOwner ? `处方 #${item.id}` : item.doctorName + ' 大夫'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>编号: {apptId}</div>
                  {isOwner && item.status && (
                    <div style={{ fontSize: 12, color: item.status === '已完成' ? '#32CD32' : '#A0522D', marginTop: 5, fontWeight: 'bold' }}>
                      {item.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {prescription ? (
        <div className="status-section">
          <div className="progress-pipeline">
            {STATUS_ORDER.map((status, idx) => {
              const currentIdx = STATUS_ORDER.indexOf(prescription.status);
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const lineCompleted = idx < currentIdx;
              return (
                <React.Fragment key={status}>
                  <div className="progress-node">
                    <div className={`progress-capsule ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div className="progress-label">{status}</div>
                  </div>
                  {idx < STATUS_ORDER.length - 1 && (
                    <div className={`progress-line ${lineCompleted ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="card status-card">
            <h3 style={{ color: '#A0522D', marginBottom: 15, textAlign: 'center' }}>处方详情</h3>
            <div className="status-info">
              <div className="status-info-item">
                <div className="label">处方编号</div>
                <div className="value">#{prescription.id}</div>
              </div>
              <div className="status-info-item">
                <div className="label">关联挂号</div>
                <div className="value" style={{ fontSize: 13 }}>{prescription.appointmentId}</div>
              </div>
              <div className="status-info-item">
                <div className="label">药材数</div>
                <div className="value">{prescription.items.length} 味</div>
              </div>
              <div className="status-info-item">
                <div className="label">当前状态</div>
                <div className="value" style={{ fontSize: 14 }}>{prescription.status}</div>
              </div>
            </div>
            <div style={{ marginTop: 20, borderTop: '1px dashed #ccc', paddingTop: 15 }}>
              <h4 style={{ color: '#C0392B', marginBottom: 10 }}>📋 药材清单</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {prescription.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 1fr',
                    padding: '8px 12px',
                    background: 'rgba(245, 240, 215, 0.6)',
                    borderRadius: 4,
                    fontSize: 14
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#C0392B' }}>{item.herbName}</span>
                    <span>{item.dosage}{item.unit}</span>
                    <span style={{ color: '#666' }}>{item.processing}</span>
                  </div>
                ))}
              </div>
            </div>
            {user.role === 'owner' && prescription.status !== '已完成' && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button className="btn btn-primary" onClick={advanceStatus}>
                  更新到下一步 →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', color: '#999', padding: 60 }}>
          请先选择挂号编号查看抓药进度
          <div style={{ fontSize: 12, marginTop: 10 }}>若为空白表示该预约尚未开出处方</div>
        </div>
      )}
    </div>
  );
}

function PharmacyPage({ user }: { user: UserInfo }) {
  const [data, setData] = useState<{
    herbs: Herb[];
    prescriptions: Prescription[];
    totalPrescriptions: number;
    completedCount: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const d = await apiRequest<typeof data>('/pharmacy/dashboard');
      setData(d);
    })();
  }, []);

  if (!data) return <div className="page-fade card" style={{ textAlign: 'center' }}>加载中...</div>;

  return (
    <div className="page-fade">
      <h1 className="page-title">🏪 药房管理</h1>
      <div className="owner-dashboard" style={{ marginBottom: 30 }}>
        <div className="card stat-card">
          <div className="stat-number">{data.totalPrescriptions}</div>
          <div className="stat-label">处方总数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-number" style={{ color: '#32CD32' }}>{data.completedCount}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="card stat-card">
          <div className="stat-number" style={{ color: '#A0522D' }}>{data.totalPrescriptions - data.completedCount}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="card stat-card">
          <div className="stat-number" style={{ color: '#666' }}>{data.herbs.filter(h => h.stock < 150).length}</div>
          <div className="stat-label">库存预警</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ color: '#A0522D', marginBottom: 15 }}>📦 药材库存</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>药材名称</th>
                <th>四性</th>
                <th>五味</th>
                <th>常用量</th>
                <th>炮制</th>
                <th>库存量(g)</th>
              </tr>
            </thead>
            <tbody>
              {data.herbs.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 'bold', color: '#C0392B' }}>{h.name}</td>
                  <td>{h.nature}性</td>
                  <td>{h.flavor}味</td>
                  <td>{h.defaultDosage}</td>
                  <td>{h.processing}</td>
                  <td className={h.stock < 150 ? 'low-stock' : ''}>{h.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (window as any).__auth = auth;
  }, [auth]);

  if (!auth.user) {
    return (
      <Routes>
        <Route path="/login" element={
          <LoginPage
            onLogin={(u) => { auth.user || (window.location.reload()); navigate('/'); }}
            onRegister={(u) => { auth.user || (window.location.reload()); navigate('/'); }}
          />
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const defaultPath = auth.user.role === 'patient' ? '/appointment' : auth.user.role === 'doctor' ? '/consultation' : '/progress';

  return (
    <div>
      <Navbar user={auth.user} onLogout={() => { auth.logout(); navigate('/login'); }} currentPath={location.pathname} />
      <div className="main-container">
        <Routes>
          <Route path="/appointment" element={auth.user.role === 'patient' ? <AppointmentPage user={auth.user} /> : <Navigate to={defaultPath} replace />} />
          <Route path="/consultation" element={auth.user.role !== 'owner' ? <ConsultationPage user={auth.user} /> : <Navigate to={defaultPath} replace />} />
          <Route path="/prescription" element={auth.user.role === 'doctor' ? <PrescriptionPage user={auth.user} /> : <Navigate to={defaultPath} replace />} />
          <Route path="/progress" element={<ProgressPage user={auth.user} />} />
          <Route path="/pharmacy" element={auth.user.role === 'owner' ? <PharmacyPage user={auth.user} /> : <Navigate to={defaultPath} replace />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </div>
    </div>
  );
}
