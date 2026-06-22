import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKanbanStore } from '@/store/kanbanStore';
import { COLORS, VOTE_TYPE_LABELS } from '@/utils/constants';
import type { Notification, Vote } from '@/types';
import dayjs from 'dayjs';

// 显示中的通知 Toast 项
interface ToastItem {
  id: string;
  notification: Notification;
  vote?: Vote;
  visible: boolean;
}

// NotificationToast 组件
export default function NotificationToast() {
  const { notifications, votes, markAsRead } = useKanbanStore();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const displayedIds = useRef<Set<string>>(new Set());

  // 监听新通知，添加到 Toast
  useEffect(() => {
    const newUnreadNotifications = notifications.filter(
      (n) => !n.read && !displayedIds.current.has(n.id)
    );

    if (newUnreadNotifications.length > 0) {
      const newToasts: ToastItem[] = newUnreadNotifications.map((n) => {
        displayedIds.current.add(n.id);
        const vote = votes.find((v) => v.id === n.voteId);
        return {
          id: n.id,
          notification: n,
          vote,
          visible: true,
        };
      });

      setToasts((prev) => [...prev, ...newToasts]);

      // 5秒后自动关闭
      newToasts.forEach((toast) => {
        setTimeout(() => {
          handleClose(toast.id);
        }, 5000);
      });
    }
  }, [notifications, votes]);

  // 关闭 Toast
  const handleClose = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    markAsRead(id);

    // 动画结束后移除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  // 获取通知类型对应的图标和颜色
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'vote_created':
        return {
          icon: <CheckCircle size={20} />,
          color: COLORS.success,
        };
      case 'vote_ended':
        return {
          icon: <AlertCircle size={20} />,
          color: COLORS.secondary,
        };
      case 'vote_result':
        return {
          icon: <Info size={20} />,
          color: COLORS.primary,
        };
      default:
        return {
          icon: <Info size={20} />,
          color: COLORS.primary,
        };
    }
  };

  // 获取投票结果摘要
  const getVoteSummary = (vote?: Vote) => {
    if (!vote) return null;

    const totalVotes = vote.options.reduce((sum, opt) => sum + opt.votes, 0);
    const topOption = [...vote.options].sort((a, b) => b.votes - a.votes)[0];

    if (totalVotes === 0) {
      return `暂无投票数据`;
    }

    const percentage = topOption
      ? Math.round((topOption.votes / totalVotes) * 100)
      : 0;

    return `领先：${topOption?.text || '未知'} (${percentage}%) · 共 ${totalVotes} 票`;
  };

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
        .toast-enter {
          animation: slideInUp 0.3s ease-out forwards;
        }
        .toast-exit {
          animation: slideOutDown 0.3s ease-out forwards;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast, index) => {
          const style = getNotificationStyle(toast.notification.type);
          return (
            <div
              key={toast.id}
              className={cn(
                'w-full rounded-xl shadow-2xl overflow-hidden cursor-pointer',
                toast.visible ? 'toast-enter' : 'toast-exit'
              )}
              style={{
                backgroundColor: 'rgba(42, 47, 74, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${style.color}40`,
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleClose(toast.id)}
            >
              <div className="p-4">
                {/* 头部 */}
                <div className="flex items-start gap-3">
                  {/* 图标 */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0'
                    )}
                    style={{
                      backgroundColor: `${style.color}20`,
                      color: style.color,
                    }}
                  >
                    {style.icon}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white text-sm truncate">
                        {toast.notification.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose(toast.id);
                        }}
                        className={cn(
                          'p-1 rounded-md transition-all duration-300 hover:scale-110 hover:bg-white/10 flex-shrink-0 -mt-1 -mr-1'
                        )}
                      >
                        <X size={16} color="rgba(160, 165, 192, 0.8)" />
                      </button>
                    </div>

                    <p
                      className="text-sm mt-1 line-clamp-2"
                      style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                    >
                      {toast.notification.message}
                    </p>

                    {/* 投票信息 */}
                    {toast.vote && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(74, 144, 217, 0.15)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${COLORS.primary}30`,
                              color: COLORS.primary,
                            }}
                          >
                            {VOTE_TYPE_LABELS[toast.vote.type]}
                          </span>
                          <span
                            className="text-xs truncate font-medium"
                            style={{ color: '#ffffff' }}
                          >
                            {toast.vote.title}
                          </span>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: 'rgba(160, 165, 192, 0.9)' }}
                        >
                          {getVoteSummary(toast.vote)}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'rgba(160, 165, 192, 0.6)' }}
                        >
                          {dayjs(toast.notification.createdAt).format('HH:mm:ss')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 进度条指示剩余时间 */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 transition-all duration-5000 ease-linear"
                  style={{
                    backgroundColor: style.color,
                    width: '100%',
                    animation: toast.visible
                      ? 'shrink 5s linear forwards'
                      : 'none',
                  }}
                />
              </div>

              <style>{`
                @keyframes shrink {
                  from { width: 100%; }
                  to { width: 0%; }
                }
              `}</style>
            </div>
          );
        })}
      </div>
    </>
  );
}
