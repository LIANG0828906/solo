import React, { useEffect, useRef, useState } from 'react';
import { useDocStore } from '@/store/docStore';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * 同步模块
 * 数据流向：
 *   订阅 store 中 users、positionPercent、currentParagraphIndex
 *   DocumentRenderer 的 scroll 事件 -> updatePosition ->
 *   经过 useDebounce(50ms) 防抖 -> broadcastPosition ->
 *   同时模拟其他用户随机滚动位置（200ms内延迟）
 *   页面右侧滚动条旁显示彩色圆点，位置根据 positionPercent 上下滑动
 */
const SyncPanel: React.FC = () => {
  const { users, currentUserId, receiveRemotePosition } = useDocStore();
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(300);

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

  const debouncedSimulateOthers = useDebounce(() => {
    users.forEach((u) => {
      if (u.id !== currentUserId && Math.random() > 0.5) {
        const newPercent = Math.max(
          0,
          Math.min(1, u.positionPercent / 100 + (Math.random() - 0.5) * 0.05)
        );
        const paragraphIndex = Math.floor(newPercent * 25);
        setTimeout(() => {
          receiveRemotePosition(u.id, newPercent * 100, paragraphIndex);
        }, 100 + Math.random() * 100);
      }
    });
  }, 2000);

  useEffect(() => {
    const interval = setInterval(() => {
      debouncedSimulateOthers();
    }, 3000);
    return () => clearInterval(interval);
  }, [debouncedSimulateOthers]);

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
    >
      {otherUsers.map((user) => {
        const safePercent = Math.max(0, Math.min(100, user.positionPercent));
        const topPosition = 40 + (safePercent / 100) * (trackHeight - 80);
        return (
          <div
            key={user.id}
            className="scrollbar-indicator-dot"
            title={`${user.name} - 阅读位置 ${safePercent.toFixed(0)}%`}
            style={{
              backgroundColor: user.color,
              top: topPosition,
            }}
          />
        );
      })}
    </div>
  );
};

export default SyncPanel;
