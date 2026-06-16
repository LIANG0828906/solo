import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User as UserIcon, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, currentUser, loading, error, clearError } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!name.trim()) {
      showToast('请输入用户名', 'error');
      return;
    }
    if (!password) {
      showToast('请输入密码', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ name: name.trim(), password });
      showToast(`欢迎回来，${user.name}！`, 'success');
      navigate('/', { replace: true });
    } catch (e: any) {
      showToast(e.message || '登录失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-card"
            style={{ backgroundColor: '#E67E22' }}
          >
            🔄
          </div>
          <h1 className="text-2xl font-bold text-secondary">欢迎回到 SwapBazaar</h1>
          <p className="text-sm text-secondary/60 mt-2">
            闲置物品交换集市，让旧物焕发新生
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">用户名</label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-secondary/10 bg-bg focus:bg-white focus:border-primary/50 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-secondary/10 bg-bg focus:bg-white focus:border-primary/50 transition-all text-sm"
                defaultValue="pass123"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#E67E22' }}
          >
            {submitting || loading ? '登录中...' : '立即登录'}
            {!(submitting || loading) && <ArrowRight size={18} />}
          </button>

          <div className="text-xs bg-bg rounded-lg p-3 text-secondary/60 leading-relaxed">
            💡 演示账号初始密码统一为 <span className="font-mono text-primary font-semibold">pass123</span>
            ，登录后可在个人资料中修改。
          </div>
        </form>

        <div className="text-center mt-6 text-sm text-secondary/60">
          还没有账号？{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: '#E67E22' }}>
            立即注册 →
          </Link>
        </div>
      </div>
    </div>
  );
}
