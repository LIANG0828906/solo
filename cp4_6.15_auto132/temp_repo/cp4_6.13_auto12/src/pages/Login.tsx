import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/utils/api';
import { useAuthStore } from '@/store';
import { getDefaultAvatar, requestNotificationPermission } from '@/utils/helpers';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(username.trim(), password);
      const user = { ...res.user, avatar: res.user.avatar || getDefaultAvatar(res.user.nickname) };
      setAuth(res.token, user);
      requestNotificationPermission();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent-secondary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center shadow-xl shadow-accent-primary/40 mb-3">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-1 text-gradient">学习追踪仪表盘</h1>
        <p className="text-center text-text-secondary mb-8">量化你的努力，看见每一步成长</p>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-zinc-700/40 rounded-2xl p-7 shadow-2xl animate-fade-slide-up"
        >
          <h2 className="text-xl font-semibold text-text-primary mb-6">欢迎回来 👋</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-field"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 animate-fade-slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium shadow-lg shadow-accent-primary/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> 登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-700/30 text-center">
            <p className="text-sm text-text-secondary">
              还没有账号？{' '}
              <Link
                to="/register"
                className="text-accent-primary hover:text-accent-primary/80 font-medium transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-text-muted mt-8">
          © 2024 学习追踪 · 让努力可被感知
        </p>
      </div>
    </div>
  );
}
