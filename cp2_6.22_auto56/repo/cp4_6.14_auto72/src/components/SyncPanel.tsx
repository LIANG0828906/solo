import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDocStore } from '@/store/docStore';

/**
 * 同步模块
 * 数据流向：
 *   - 订阅 store.users 和 positionPercent 状态
 *   - DocumentRenderer 的 scroll 事件 -> updatePosition
 *     -> 经过 50ms 防抖（合并多次更新） -> 广播位置
 *   - 右侧滚动条旁显示用户阅读位置彩色圆点（12px）
 *   - 颜色按红、蓝、绿、橙、紫循环
 *
 * 防抖实现：
 *   使用位置缓存 + 单次定时器，50ms 内的多次更新只发送最后一次。
 *   pendingPosition 累积最新值，定时器到期后统一广播。
 *   避免每次滚动事件都触发一次消息。
 */
const SyncPanel: React.FC = () => {
  const { users, currentUserId, receiveRemotePosition, positionPercent } =
    useDocStore();
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(400);

  const pendingPositionRef = useRef<{ percent: number; paragraphIndex: number } | null>(
    null
  );
  const syncTimerRef = useRef<number | null>(null);

  /**
   * 防抖位置广播：50ms 间隔内合并多次更新，只发送最后一次
   */
  const broadcastPositionDebounced = useCallback(
    (percent: number, paragraphIndex: number) => {
      pendingPositionRef.current = { percent, paragraphIndex };

      if (syncTimerRef.current !== null) {
        return;
      }

      syncTimerRef.current = window.setTimeout(() => {
        if (pendingPositionRef.current) {
          const { percent: p, paragraphIndex: idx } = pendingPositionRef.current;
          receiveRemotePosition(currentUserId, p, idx);
          pendingPositionRef.current = null;
        }
        syncTimerRef.current = null;
      }, 50);
    },
    [currentUserId, receiveRemotePosition]
  );

  useEffect(() => {
    broadcastPositionDebounced(positionPercent, useDocStore.getState().currentParagraphIndex);
  }, [positionPercent, broadcastPositionDebounced]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (scrollTrackRef.current) {
        setTrackHeight(scrollTrackRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const allUsers = useDocStore.getState().users;
      allUsers.forEach((u) => {
        if (u.id !== currentUserId && Math.random() > 0.6) {
          const newPercent = Math.max(
            0,
            Math.min(100, u.positionPercent + (Math.random() - 0.5) * 8)
          );
          const paragraphIndex = Math.floor((newPercent / 100) * 25);
          receiveRemotePosition(u.id, newPercent, paragraphIndex);
        }
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [currentUserId, receiveRemotePosition]);

  const otherUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <div
      ref={scrollTrackRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 20,
        height: '100%',
        pointerEvents: 'none',
      }}
      aria-label="用户阅读位置指示器"
    >
      {otherUsers.map((user) => {
        const safePercent = Math.max(0, Math.min(100, user.positionPercent));
        const topPosition = 40 + (safePercent / 100) * Math.max(0, trackHeight - 80);
        return (
          <div
            key={user.id}
            className="scrollbar-indicator-dot"
            title={`${user.name} - 阅读位置 ${safePercent.toFixed(0)}%`}
            style={{
              backgroundColor: user.color,
              top: topPosition,
              transition: 'top 0.2s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

export default SyncPanel;
