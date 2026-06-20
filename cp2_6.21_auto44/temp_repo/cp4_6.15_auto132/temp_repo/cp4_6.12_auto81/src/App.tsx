import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import AdminPanel from './components/AdminPanel';
import { Blessing, DataManager } from './utils/DataManager';
import './App.css';

type ViewType = 'home' | 'admin';

function App() {
  const [view, setView] = useState<ViewType>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setBlessings(DataManager.getBlessings());
  }, [refreshKey]);

  const refreshData = () => setRefreshKey(k => k + 1);

  const handleOpenLogin = () => {
    setShowLogin(true);
    setLoginPwd('');
    setLoginError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = DataManager.getConfig();
    if (loginPwd === cfg.adminPassword) {
      setShowLogin(false);
      setView('admin');
    } else {
      setLoginError('密码错误，请重试');
    }
  };

  const handleLogout = () => {
    setView('home');
  };

  return (
    <div className="app-root">
      {view === 'home' && (
        <HomePage blessings={blessings} onBlessingAdded={refreshData} />
      )}
      {view === 'admin' && (
        <AdminPanel onLogout={handleLogout} onDataChanged={refreshData} />
      )}

      {view === 'home' && (
        <button
          className="admin-entry-btn"
          onClick={handleOpenLogin}
          title="管理后台入口"
          aria-label="管理后台"
        >
          ⚙
        </button>
      )}

      {showLogin && (
        <div className="modal-mask" onClick={() => setShowLogin(false)}>
          <div className="modal-dialog card" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20 }}>管理后台登录</h3>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                className="form-input"
                placeholder="请输入管理密码"
                value={loginPwd}
                onChange={e => { setLoginPwd(e.target.value); setLoginError(''); }}
                autoFocus
                style={{ marginBottom: 12 }}
              />
              {loginError && (
                <div style={{ color: '#ff4757', fontSize: 13, marginBottom: 12 }}>
                  {loginError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowLogin(false)}>
                  取消
                </button>
                <button type="submit" className="btn-gold">登录</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                默认密码：admin
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
