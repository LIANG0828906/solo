import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const [username, setUsername] = useState('张小明');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, addToast } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        addToast({ message: `欢迎回来，${data.user.username}！`, type: 'success' });
        navigate('/boards');
      } else {
        addToast({ message: data.error || '登录失败', type: 'error' });
      }
    } catch {
      addToast({ message: '网络错误，请重试', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const quickUsers = ['张小明', '李小红', '王小强', '赵小美'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mint/20 mb-4">
            <Users className="w-8 h-8 text-mint" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">团队协作看板</h1>
          <p className="text-white/70 text-sm">实时追踪任务进度，提升团队协作效率</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">快速登录（演示账号）：</p>
            <div className="flex flex-wrap gap-2">
              {quickUsers.map((name) => (
                <button
                  key={name}
                  onClick={() => setUsername(name)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    username === name
                      ? 'bg-mint/30 text-primary font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          点击上方演示账号即可快速登录体验
        </p>
      </div>
    </div>
  );
}
