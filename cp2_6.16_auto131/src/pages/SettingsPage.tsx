import { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Save } from 'lucide-react';
import { useUserStore } from '../modules/user/userStore';

export default function SettingsPage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const login = useUserStore((state) => state.login);
  const logout = useUserStore((state) => state.logout);
  const isLoading = useUserStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage('请输入用户名');
      return;
    }

    try {
      await login(username.trim());
      setMessage('登录成功！');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录失败');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUsername('');
    setMessage('已退出登录');
    setTimeout(() => setMessage(''), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <SettingsIcon className="w-7 h-7 text-blue-500" />
        设置
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          用户信息
        </h3>

        {currentUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: '#42A5F5' }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{currentUser.name}</p>
                <p className="text-sm text-gray-500">当前登录用户</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              退出登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                输入用户名即可登录，无需密码。新用户名会自动注册。
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              登录 / 注册
            </button>
          </form>
        )}

        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">关于</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          TeamTally 是一个轻量级的团队任务与工时协作平台。
          您可以发布任务、认领任务、记录工时，并查看个人和团队的贡献排行。
          所有数据都保存在您的浏览器本地，不会上传到任何服务器。
        </p>
        <p className="text-xs text-gray-400 mt-3">
          版本 0.1.0
        </p>
      </div>
    </div>
  );
}
