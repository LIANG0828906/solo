import { useEffect, useState } from 'react';
import { Music, FolderOpen, Users, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'projects', label: '全部项目', icon: FolderOpen },
  { id: 'tasks', label: '我的任务', icon: Music },
  { id: 'collaborators', label: '协作者', icon: Users },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState('projects');

  const currentUser = { name: '我', color: '#F59E0B' };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleMenuClick = (id: string) => {
    setActiveMenu(id);
    onClose();
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1).toUpperCase();
  };

  return (
    <>
      <button
        onClick={onClose}
        className={cn(
          'fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full lg:hidden',
          isOpen ? 'hidden' : 'bg-[#374151] hover:bg-[#374151]'
        )}
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-[#0F172A]/95 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'transition-opacity duration-300'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col bg-bg-sidebar',
          'transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-text-primary">导航</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#374151]"
          >
            <X className="h-5 w-5 text-text-primary" />
          </button>
        </div>

        <div className="hidden lg:block p-6">
          <h1 className="text-xl font-bold text-text-primary">Auto70</h1>
          <p className="mt-1 text-sm text-text-secondary">音乐协作平台</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                      isActive
                        ? 'bg-accent/20 text-accent'
                        : 'text-text-secondary hover:bg-[#374151] hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#374151] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {getInitials(currentUser.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-text-secondary">在线</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
