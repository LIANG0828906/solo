import { useState, useEffect, useRef } from 'react';
import { Bell, Plus, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKanbanStore } from '@/store/kanbanStore';
import { COLORS, VOTE_TYPE_LABELS } from '@/utils/constants';
import type { VoteType } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Navbar 组件属性
interface NavbarProps {
  onOpenVoteCreator: () => void;
}

// Navbar 组件
export default function Navbar({ onOpenVoteCreator }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, votes } = useKanbanStore();

  // 监听滚动事件，调整透明度
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击外部关闭通知列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // 获取通知对应的投票信息
  const getVoteInfo = (voteId?: string) => {
    if (!voteId) return null;
    return votes.find((v) => v.id === voteId);
  };

  // 处理通知点击
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-lg',
        scrolled ? 'py-2' : 'py-4'
      )}
      style={{
        backgroundColor: scrolled
          ? 'rgba(26, 31, 54, 0.95)'
          : 'rgba(26, 31, 54, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(74, 144, 217, 0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* 左侧 Logo 和应用名称 */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md"
            style={{ backgroundColor: COLORS.primary }}
          >
            投
          </div>
          <h1 className="text-xl font-bold text-white">社群投票系统</h1>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-4">
          {/* 创建投票按钮 */}
          <button
            onClick={onOpenVoteCreator}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105'
            )}
            style={{ backgroundColor: COLORS.primary }}
          >
            <Plus size={18} />
            <span>创建投票</span>
          </button>

          {/* 通知按钮 */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105'
              )}
              style={{ backgroundColor: COLORS.card }}
            >
              <Bell size={20} color="#ffffff" />
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1'
                  )}
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* 通知列表 */}
            <div
              className={cn(
                'absolute right-0 mt-3 w-80 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-right',
                showNotifications
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              )}
              style={{
                backgroundColor: 'rgba(42, 47, 74, 0.98)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(74, 144, 217, 0.2)',
              }}
            >
              {/* 通知头部 */}
              <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(74, 144, 217, 0.2)' }}>
                <span className="font-semibold text-white">通知</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-sm transition-colors duration-300 hover:opacity-80"
                    style={{ color: COLORS.primary }}
                  >
                    <CheckCircle size={14} />
                    全部已读
                  </button>
                )}
              </div>

              {/* 通知列表内容 */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center" style={{ color: 'rgba(160, 165, 192, 0.8)' }}>
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const vote = getVoteInfo(notification.voteId);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={cn(
                          'px-4 py-3 border-b cursor-pointer transition-all duration-300 hover:bg-white/5',
                          !notification.read && 'bg-white/5'
                        )}
                        style={{ borderColor: 'rgba(74, 144, 217, 0.1)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                              notification.read ? 'bg-transparent' : ''
                            )}
                            style={{ backgroundColor: notification.read ? 'transparent' : COLORS.secondary }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn('font-medium text-sm text-white truncate')}>
                                {notification.title}
                              </span>
                              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(160, 165, 192, 0.8)' }}>
                                {dayjs(notification.createdAt).fromNow()}
                              </span>
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'rgba(160, 165, 192, 0.9)' }}>
                              {notification.message}
                            </p>
                            {vote && (
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className="text-xs px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: 'rgba(74, 144, 217, 0.2)', color: COLORS.primary }}
                                >
                                  {VOTE_TYPE_LABELS[vote.type as VoteType]}
                                </span>
                                <span className="text-xs truncate" style={{ color: 'rgba(160, 165, 192, 0.8)' }}>
                                  {vote.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
