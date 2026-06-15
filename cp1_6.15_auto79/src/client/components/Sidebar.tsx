import { Music, Plus, History, User } from 'lucide-react';

/**
 * 左侧导航栏组件
 * - 桌面端：100px宽，垂直居中布局，背景色#0f3460
 * - 移动端：50px高的顶部横栏
 */
interface SidebarProps {
  onCreateClick?: () => void;
  onHomeClick?: () => void;
  onHistoryClick?: () => void;
  onProfileClick?: () => void;
}

export function Sidebar({
  onCreateClick,
  onHomeClick,
  onHistoryClick,
  onProfileClick,
}: SidebarProps) {
  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside
        className="desktop-sidebar fixed left-0 top-0 h-full flex flex-col items-center justify-between py-8 z-30"
        style={{ width: '100px', backgroundColor: '#0f3460' }}
      >
        {/* 顶部导航图标组 */}
        <div className="flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={onHomeClick}
            className="nav-icon-btn flex items-center justify-center rounded-lg text-white/80 hover:text-white"
            style={{ width: 48, height: 48, borderRadius: 8 }}
            title="音乐主页"
          >
            <Music size={24} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={onCreateClick}
            className="nav-icon-btn flex items-center justify-center rounded-lg text-white"
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: '#e94560',
            }}
            title="创建项目"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={onHistoryClick}
            className="nav-icon-btn flex items-center justify-center rounded-lg text-white/80 hover:text-white"
            style={{ width: 48, height: 48, borderRadius: 8 }}
            title="版本历史"
          >
            <History size={24} strokeWidth={2} />
          </button>
        </div>

        {/* 底部用户头像 */}
        <button
          type="button"
          onClick={onProfileClick}
          className="nav-icon-btn flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white"
          style={{ width: 48, height: 48 }}
          title="用户中心"
        >
          <User size={22} strokeWidth={2} />
        </button>
      </aside>

      {/* 移动端顶部横栏 */}
      <nav
        className="mobile-topbar fixed top-0 left-0 right-0 h-[50px] flex items-center justify-between px-4 z-30"
        style={{ backgroundColor: '#0f3460' }}
      >
        <button
          type="button"
          onClick={onHomeClick}
          className="nav-icon-btn flex items-center justify-center rounded-lg text-white/80 hover:text-white"
          style={{ width: 40, height: 40, borderRadius: 8 }}
        >
          <Music size={22} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onCreateClick}
          className="nav-icon-btn flex items-center justify-center rounded-lg text-white"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#e94560',
          }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHistoryClick}
            className="nav-icon-btn flex items-center justify-center rounded-lg text-white/80 hover:text-white"
            style={{ width: 40, height: 40, borderRadius: 8 }}
          >
            <History size={22} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className="nav-icon-btn flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white"
            style={{ width: 40, height: 40 }}
          >
            <User size={20} strokeWidth={2} />
          </button>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
