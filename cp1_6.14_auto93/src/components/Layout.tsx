import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Settings, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  activeNav?: string;
}

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/plan', label: '计划', icon: Calendar },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Layout({ children, rightPanel, activeNav }: LayoutProps) {
  const location = useLocation();
  const currentPath = activeNav || location.pathname;

  return (
    <div className="min-h-screen bg-[#FAFBF7]">
      {/* 桌面端布局 */}
      <div className="hidden lg:flex min-h-screen">
        {/* 左侧导航栏 */}
        <aside
          className="w-60 flex-shrink-0 border-r border-gray-200 bg-[#F5F0E1] flex flex-col"
        >
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7CB342] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">营养管家</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#7CB342] text-white shadow-md'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm active:scale-95'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 中间主内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* 右侧今日概览面板 */}
        {rightPanel && (
          <aside className="w-80 flex-shrink-0 p-6">
            <div className="sticky top-6">
              {rightPanel}
            </div>
          </aside>
        )}
      </div>

      {/* 移动端布局 */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* 顶部状态栏 */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#F5F0E1] border-b border-gray-200 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7CB342] flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-800">营养管家</span>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 pt-14 pb-16 overflow-auto">
          {children}
        </main>

        {/* 底部导航栏 */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all active:scale-95',
                  isActive ? 'text-[#7CB342]' : 'text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
