import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ServerCog,
  ShieldCheck,
  Search,
  Bell,
  User,
  LayoutDashboard,
  Building2,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { v4 as uuid } from 'uuid'

export default function App() {
  const notifications = useAppStore((s) => s.notifications)
  const removeNotification = useAppStore((s) => s.removeNotification)
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const timers: number[] = []
    notifications.forEach((n) => {
      const t = window.setTimeout(() => removeNotification(n.id), 4000)
      timers.push(t)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [notifications, removeNotification])

  useEffect(() => {
    const timers: number[] = []
    toasts.forEach((t) => {
      const id = window.setTimeout(() => removeToast(t.id), 6000)
      timers.push(id)
    })
    return () => timers.forEach((t) => clearTimeout(t))
  }, [toasts, removeToast])

  const navItems = [
    { to: '/', icon: CalendarDays, label: '会议日历' },
    { to: '/resources', icon: ServerCog, label: '资源管理' },
    { to: '/admin', icon: ShieldCheck, label: '管理面板' },
  ]

  const notifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default:
        return <Info className="w-4 h-4 text-primary-500" />
    }
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 p-4">
        <div className="sidebar-glow h-full rounded-2xl p-5 flex flex-col transition-all duration-300 sidebar-glow">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold leading-tight">
                SmartRoom
              </div>
              <div className="text-white/50 text-xs">智能会议调度</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="rounded-xl bg-white/5 p-4 text-white/70 text-xs space-y-1.5 border border-white/5">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <LayoutDashboard className="w-3.5 h-3.5" />
                系统提示
              </div>
              <p>点击日历空白时段可快速创建会议，设备状态实时同步。</p>
            </div>
            <div className="mt-4 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-white text-xs">
                <div className="font-medium">李小明</div>
                <div className="text-white/50">管理员</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 px-6 flex items-center gap-4 border-b border-gray-100 bg-white/70 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-800">
              {location.pathname === '/resources'
                ? '资源管理'
                : location.pathname === '/admin'
                  ? '管理面板'
                  : '会议日历'}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="搜索会议或会议室…"
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <button className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 transition flex items-center justify-center text-gray-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Top Notifications */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-[480px] max-w-[90%] pointer-events-none">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg animate-fade-in bg-white border-l-4 ${
                n.type === 'error'
                  ? 'border-red-500'
                  : n.type === 'warning'
                    ? 'border-amber-500'
                    : n.type === 'success'
                      ? 'border-green-500'
                      : 'border-primary-500'
              }`}
            >
              {notifIcon(n.type)}
              <span className="text-sm text-gray-700 flex-1">{n.message}</span>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* Toast bubbles (bottom right) */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
          {toasts.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.bookingId) {
                  navigate('/admin')
                }
                removeToast(t.id)
              }}
              className={`animate-slide-up text-left card-base card-hover p-4 border-l-4 ${
                t.type === 'error'
                  ? 'border-red-500'
                  : t.type === 'warning'
                    ? 'border-amber-500'
                    : t.type === 'success'
                      ? 'border-green-500'
                      : 'border-primary-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    t.type === 'error'
                      ? 'bg-red-50 text-red-500'
                      : t.type === 'warning'
                        ? 'bg-amber-50 text-amber-500'
                        : t.type === 'success'
                          ? 'bg-green-50 text-green-500'
                          : 'bg-primary-50 text-primary-500'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-0.5">
                    {t.type === 'error'
                      ? '错误通知'
                      : t.type === 'warning'
                        ? '提醒通知'
                        : t.type === 'success'
                          ? '成功通知'
                          : '系统消息'}
                  </div>
                  <div className="text-sm text-gray-800 break-words">
                    {t.message}
                  </div>
                  {t.bookingId && (
                    <div className="mt-1 text-xs text-primary-600 font-medium">
                      点击查看详情 →
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
