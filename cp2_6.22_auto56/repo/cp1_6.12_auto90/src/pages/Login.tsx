import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { User } from '@/types';

export default function Login() {
  const navigate = useNavigate();
  const users = useAppStore((s) => s.users);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (users.length > 0 && !selectedId) {
      setSelectedId(users[0].id);
    }
  }, [users, selectedId]);

  const handleLogin = () => {
    const user = users.find((u) => u.id === selectedId) as User | undefined;
    if (!user) return;
    setLoading(true);
    setTimeout(() => {
      setCurrentUser(user);
      navigate('/preference');
    }, 200);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">🏢 办公室偏好收集系统</h1>
        <p className="login-subtitle">记录你的个性化办公习惯，提升团队幸福感 ✨</p>

        <label className="login-label" htmlFor="user-select">请选择你的姓名</label>
        <select
          id="user-select"
          className="login-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <button
          className="btn-gradient"
          onClick={handleLogin}
          disabled={!selectedId || loading}
        >
          {loading ? '登录中...' : '登 录'}
        </button>
      </div>
    </div>
  );
}
