import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MemberDashboard from './member/MemberDashboard';
import BookSearch from './member/BookSearch';
import AdminPanel from './admin/AdminPanel';

export interface Member {
  id: string;
  name: string;
  email: string;
  registration_date: string;
  points: number;
  role: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

export function App() {
  const [member, setMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('library_member');
    return saved ? JSON.parse(saved) : null;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (member) {
      localStorage.setItem('library_member', JSON.stringify(member));
    } else {
      localStorage.removeItem('library_member');
    }
  }, [member]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleLogin = (m: Member) => {
    setMember(m);
    if (m.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setMember(null);
    navigate('/');
  };

  return (
    <div className="app-layout">
      {member && (
        <nav className="navbar">
          <a className="navbar-brand" href={member.role === 'admin' ? '/admin' : '/dashboard'}>
            <span className="brand-icon">📚</span>
            <span>智能图书借阅</span>
          </a>
          <div className="navbar-right">
            <div className="navbar-user">
              <div className="avatar">{member.name[0]}</div>
              <span>{member.name}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              退出
            </button>
          </div>
        </nav>
      )}

      <Routes>
        <Route
          path="/"
          element={
            member ? (
              <Navigate to={member.role === 'admin' ? '/admin' : '/dashboard'} />
            ) : (
              <LoginPage onLogin={handleLogin} addToast={addToast} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            member && member.role !== 'admin' ? (
              <MemberDashboard member={member} setMember={setMember} addToast={addToast} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/search"
          element={
            member && member.role !== 'admin' ? (
              <BookSearch member={member} addToast={addToast} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            member && member.role === 'admin' ? (
              <AdminPanel addToast={addToast} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>

      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-error' : ''}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function LoginPage({ onLogin, addToast }: { onLogin: (m: Member) => void; addToast: (msg: string, type: 'success' | 'error') => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name.trim()) {
        setError('请输入姓名');
        return;
      }
    }
    if (!email.trim() || !password.trim()) {
      setError('请输入邮箱和密码');
      return;
    }

    try {
      const url = isRegister ? '/api/register' : '/api/login';
      const body = isRegister ? { name, email, password } : { email, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '操作失败');
        return;
      }
      localStorage.setItem('library_token', data.token);
      onLogin({ ...data.member, role: data.member.role || (data.member.id === 'admin' ? 'admin' : 'member') });
      addToast(isRegister ? '注册成功！' : '登录成功！', 'success');
    } catch {
      setError('网络错误，请重试');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>📚 智能图书借阅</h2>
        <p className="subtitle">社区图书馆智能借阅管理系统</p>
        <div className="login-tabs">
          <button className={`login-tab ${!isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(false); setError(''); }}>
            登录
          </button>
          <button className={`login-tab ${isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(true); setError(''); }}>
            注册
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          {isRegister && (
            <div className="form-group">
              <label>姓名</label>
              <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="请输入您的姓名" />
            </div>
          )}
          <div className="form-group">
            <label>邮箱</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            {isRegister ? '注册' : '登录'}
          </button>
        </form>
        {!isRegister && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
            测试账号：zhangsan@library.com / 123456
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
