import React from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';

const Home: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">欢迎来到图书交换平台</h1>
    <p className="text-gray-600">在这里，您可以分享和交换您的图书</p>
  </div>
);

const BookShelf: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">我的书架</h1>
    <p className="text-gray-600">管理您的个人图书</p>
  </div>
);

const ExchangeCenter: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">交换中心</h1>
    <p className="text-gray-600">浏览和发起图书交换</p>
  </div>
);

const Messages: React.FC = () => {
  const { messages, unreadCount, markAllRead, markRead } = useNotification();
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">消息中心</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            全部标为已读
          </button>
        )}
      </div>
      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded border ${
              message.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'
            }`}
            onClick={() => !message.isRead && markRead(message.id)}
          >
            <div className="flex justify-between">
              <span className="font-medium">{message.content}</span>
              <span className="text-sm text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">登录</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          登录
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        还没有账号？<Link to="/register" className="text-blue-500 hover:underline">立即注册</Link>
      </p>
    </div>
  );
};

const Register: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">注册</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          注册
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        已有账号？<Link to="/login" className="text-blue-500 hover:underline">立即登录</Link>
      </p>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, isConnected } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-6">
            <Link to="/" className="text-xl font-bold hover:text-blue-400">
              图书交换
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/bookshelf" className="hover:text-blue-400">
                  我的书架
                </Link>
                <Link to="/exchange" className="hover:text-blue-400">
                  交换中心
                </Link>
                <Link to="/messages" className="hover:text-blue-400 relative">
                  消息
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isConnected && (
              <span className="text-xs text-green-400">● 已连接</span>
            )}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 text-sm"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 border rounded hover:bg-gray-700 text-sm"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-sm"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/bookshelf"
          element={
            <ProtectedRoute>
              <BookShelf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <ExchangeCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
