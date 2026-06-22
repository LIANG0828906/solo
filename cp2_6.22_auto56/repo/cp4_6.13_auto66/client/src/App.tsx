import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string): boolean => {
    if (path === '/recipes') {
      return location.pathname === '/recipes' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <Link to="/recipes" className="navbar-brand">
        ☕ 咖啡创意实验室
      </Link>
      <ul className="navbar-nav">
        <li>
          <Link
            to="/recipes"
            className={`nav-link ${isActive('/recipes') ? 'active' : ''}`}
          >
            配方广场
          </Link>
        </li>
        <li>
          <Link
            to="/challenge"
            className={`nav-link ${isActive('/challenge') ? 'active' : ''}`}
          >
            每日挑战
          </Link>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                {user?.username}
              </Link>
            </li>
            <li>
              <button className="nav-link" onClick={handleLogout}>
                退出登录
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                登录
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className={`nav-link ${isActive('/register') ? 'active' : ''}`}
              >
                注册
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [shake, setShake] = useState(false);
  const { login, isAuthenticated, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/recipes');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError('');

    if (!username.trim() || !password.trim()) {
      setFormError('请填写所有字段');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      await login({ username, password });
    } catch {
    }
  };

  return (
    <div className="page-container page-fade-enter">
      <div className={`auth-container ${shake ? 'form-error-shake' : ''}`}>
        <h1 className="auth-title">欢迎回来</h1>
        <p className="auth-subtitle">登录以继续探索咖啡配方</p>

        {formError && (
          <div className="alert alert-error">{formError}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--color-text-light)' }}>
          还没有账号？ <Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [shake, setShake] = useState(false);
  const { register, isAuthenticated, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/recipes');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError('');

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setFormError('请填写所有字段');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (password !== confirmPassword) {
      setFormError('两次输入的密码不一致');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (password.length < 6) {
      setFormError('密码长度至少6位');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      await register({ username, email, password });
    } catch {
    }
  };

  return (
    <div className="page-container page-fade-enter">
      <div className={`auth-container ${shake ? 'form-error-shake' : ''}`}>
        <h1 className="auth-title">创建账号</h1>
        <p className="auth-subtitle">加入咖啡创意实验室</p>

        {formError && (
          <div className="alert alert-error">{formError}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位字符"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className={`form-input ${formError ? 'form-input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--color-text-light)' }}>
          已有账号？ <Link to="/login">立即登录</Link>
        </p>
      </div>
    </div>
  );
};

const RecipesPage: React.FC = () => {
  return (
    <div className="page-container page-fade-enter">
      <h1 className="section-title">☕ 咖啡配方广场</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
        探索来自世界各地的手冲咖啡配方，找到属于你的那一杯。
      </p>
      <div className="recipe-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="recipe-card" onClick={() => window.location.href = `/recipe/${i}`}>
            <div className="recipe-card-image" style={{ background: 'linear-gradient(135deg, #D2B48C, #8B4513)' }} />
            <div className="recipe-card-content">
              <h3 className="recipe-card-title">示例配方 {i}</h3>
              <div className="recipe-card-meta">
                <span>🫘 埃塞俄比亚</span>
                <span>🌡️ 92°C</span>
                <span>⏱️ 3:00</span>
              </div>
              <div className="recipe-card-rating" style={{ marginBottom: '12px' }}>
                ⭐ 4.{i} ({10 + i * 5} 评分)
              </div>
              <button className="btn btn-detail">查看详情 →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecipeDetailPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="page-container page-fade-enter">
      <h1 className="section-title">配方详情</h1>
      <div className="challenge-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', color: 'var(--color-primary)', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          手冲配方示例
        </h2>
        <div style={{ position: 'relative', zIndex: 1, color: 'var(--color-text)' }}>
          <p style={{ marginBottom: '8px' }}><strong>咖啡豆：</strong>埃塞俄比亚 耶加雪菲</p>
          <p style={{ marginBottom: '8px' }}><strong>研磨度：</strong>中细研磨</p>
          <p style={{ marginBottom: '8px' }}><strong>水温：</strong>92°C</p>
          <p style={{ marginBottom: '8px' }}><strong>冲煮方式：</strong>V60 手冲</p>
        </div>
      </div>
      {!isAuthenticated && (
        <div className="alert alert-error">
          请 <Link to="/login">登录</Link> 后才能评分和评论
        </div>
      )}
    </div>
  );
};

const ChallengePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  };

  return (
    <div className="page-container page-fade-enter">
      <h1 className="section-title">🏆 每日挑战</h1>
      <div className="challenge-card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--color-primary)', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
          今日挑战
        </h2>
        <div style={{ position: 'relative', zIndex: 1, color: 'var(--color-text)' }}>
          <p style={{ marginBottom: '8px', fontSize: '18px' }}>
            <strong>咖啡豆：</strong>哥伦比亚 慧兰
          </p>
          <p style={{ marginBottom: '8px' }}><strong>推荐器具：</strong>Chemex</p>
          <p style={{ marginBottom: '16px' }}>
            使用指定咖啡豆和器具，发挥你的创意，冲煮出独特风味的咖啡！
          </p>
          <button className="btn btn-primary" onClick={handleSubmit}>
            提交我的作品
          </button>
        </div>
      </div>
      <h2 className="section-title">参赛作品</h2>
      <div className="recipe-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="recipe-card">
            <div className="recipe-card-image" style={{ background: 'linear-gradient(135deg, #DEB887, #D35400)' }} />
            <div className="recipe-card-content">
              <h3 className="recipe-card-title">参赛作品 {i}</h3>
              <div className="recipe-card-meta">
                <span>👤 咖啡爱好者{i}</span>
                <span>⭐ {4 + i * 0.2}</span>
              </div>
              <button className="btn btn-detail">查看详情 →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="page-container page-fade-enter">
      <div className="profile-header">
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>👋 你好，{user.username}</h1>
        <p style={{ opacity: 0.9 }}>{'email' in user ? user.email : ''}</p>
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">12</div>
            <div className="stat-label">我的配方</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4.6</div>
            <div className="stat-label">平均评分</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">8</div>
            <div className="stat-label">挑战参赛</div>
          </div>
        </div>
      </div>

      <h2 className="section-title">我的配方</h2>
      <div className="recipe-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="recipe-card">
            <div className="recipe-card-image" style={{ background: 'linear-gradient(135deg, #FFB347, #8B4513)' }} />
            <div className="recipe-card-content">
              <h3 className="recipe-card-title">我的配方 {i}</h3>
              <div className="recipe-card-meta">
                <span>🫘 曼特宁</span>
                <span>🌡️ 90°C</span>
              </div>
              <div className="recipe-card-rating" style={{ marginBottom: '12px' }}>
                ⭐ 4.{5 + i}
              </div>
              <button className="btn btn-detail">查看详情 →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/challenge" element={<ChallengePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/recipes" replace />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
