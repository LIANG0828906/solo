import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, BookOpen } from 'lucide-react';
import { register as registerApi, login as loginApi } from '../../api';
import type { User as UserType } from '../../types';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPwd) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(name, email, password);
      if (res.success) {
        const loginRes = await loginApi(email, password);
        if (loginRes.success && loginRes.data) {
          localStorage.setItem('token', loginRes.data.token);
          const user: UserType = loginRes.data.user;
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/');
        } else {
          navigate('/login');
        }
      } else {
        setError(res.message || '注册失败');
      }
    } catch {
      setError('注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="page-enter w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary/30">
          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-accent mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-accent">创建账号</h1>
            <p className="text-gray-500 mt-1">加入社区图书馆</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="请输入姓名"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="请输入邮箱"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="至少6位密码"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                  placeholder="再次输入密码"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            已有账号？
            <Link to="/login" className="text-accent hover:underline ml-1">去登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
