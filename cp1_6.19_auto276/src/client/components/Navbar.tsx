import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore, api, updateAuthHeader } from '../store';

const Navbar = () => {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = showAuth === 'login' ? '/login' : '/register';
      const res = await api.post(`/users${endpoint}`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      updateAuthHeader(res.data.token);
      setUser(res.data.user);
      setShowAuth(null);
      setForm({ email: '', password: '', username: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthHeader('');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="nav-left">
            <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="#2C3E50">
                <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H6V4h5v7l2.5-1.5L16 11V4h2v16z" />
              </svg>
              校园书社
            </div>
            <div className="nav-links">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                教材交换
              </NavLink>
              <NavLink to="/notes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                笔记众筹
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  仪表盘
                </NavLink>
              )}
            </div>
          </div>
          <div className="nav-right">
            {user ? (
              <>
                <span style={{ fontSize: 14, color: '#555' }}>你好，{user.username}</span>
                <button className="btn btn-ghost" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setShowAuth('login')}>登录</button>
                <button className="btn btn-primary" onClick={() => setShowAuth('register')}>注册</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className={`mobile-sidebar ${mobileOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavLink to="/" onClick={() => setMobileOpen(false)} style={{ padding: '10px', borderRadius: 6 }}>教材交换</NavLink>
            <NavLink to="/notes" onClick={() => setMobileOpen(false)} style={{ padding: '10px', borderRadius: 6 }}>笔记众筹</NavLink>
            {user && (
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} style={{ padding: '10px', borderRadius: 6 }}>仪表盘</NavLink>
            )}
          </div>
        </div>
      )}

      {showAuth && (
        <div className="modal-overlay" onClick={() => setShowAuth(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{showAuth === 'login' ? '登录' : '注册'}</h2>
            <form onSubmit={handleSubmit}>
              {showAuth === 'register' && (
                <div className="form-group">
                  <label className="form-label">用户名</label>
                  <input
                    className="form-input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="请输入用户名"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="请输入密码"
                />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAuth(null)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '处理中...' : (showAuth === 'login' ? '登录' : '注册')}
                </button>
              </div>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
              {showAuth === 'login' ? (
                <span>还没有账号？<a style={{ color: '#E67E22', cursor: 'pointer' }} onClick={() => setShowAuth('register')}>立即注册</a></span>
              ) : (
                <span>已有账号？<a style={{ color: '#E67E22', cursor: 'pointer' }} onClick={() => setShowAuth('login')}>立即登录</a></span>
              )}
            </p>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#aaa' }}>
              演示账号：demo1@campus.edu / demo2@campus.edu，密码：123456
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
