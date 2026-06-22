/**
 * 【文件职责】路由主组件，配置全局路由表、路由守卫、布局（NavBar + 主体球场地板背景）
 * 【关键调用链】main.tsx → BrowserRouter → App.tsx → useSessionStore.fetchSession() 初始化session → Routes按路径渲染 → 每个Page接收 session user
 * 【数据流向】BrowserRouter 提供路由上下文 → App 获取 session user → NavBar(user, onLogout) → Routes/Route 渲染页面 → 路由守卫判断是否需要登录
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import CreateMatchPage from '@/pages/CreateMatchPage';
import MatchDetailPage from '@/pages/MatchDetailPage';
import HistoryPage from '@/pages/HistoryPage';
import { useSessionStore } from '@/store/sessionStore';
import { Loader2 } from 'lucide-react';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const isLoading = useSessionStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-court-cream bg-court-brown/80 px-6 py-3 rounded-full shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const user = useSessionStore((s) => s.user);
  const isLoading = useSessionStore((s) => s.isLoading);
  const initialized = useSessionStore((s) => s.initialized);
  const fetchSession = useSessionStore((s) => s.fetchSession);
  const logout = useSessionStore((s) => s.logout);

  useEffect(() => {
    if (!initialized) {
      fetchSession();
    }
  }, [initialized, fetchSession]);

  if (isLoading && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center court-floor">
        <div className="flex items-center gap-2 text-court-cream bg-court-brown/90 px-8 py-4 rounded-full shadow-2xl">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg font-medium">初始化中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen court-floor">
      <NavBar user={user} onLogout={logout} />
      <main className="pt-20 pb-10 px-4 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route
            path="/create"
            element={
              <RequireAuth>
                <CreateMatchPage />
              </RequireAuth>
            }
          />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
