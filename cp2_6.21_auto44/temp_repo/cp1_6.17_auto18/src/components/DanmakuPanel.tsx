import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../stores/dashboardStore';
import './DanmakuPanel.css';

const DanmakuPanel: React.FC = () => {
  const danmakus = useDashboardStore((state) => state.danmakus);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [danmakus]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="danmaku-panel">
      <div className="panel-header">
        <h3>弹幕互动</h3>
        <span className="danmaku-count">{danmakus.length}</span>
      </div>
      <div className="danmaku-list" ref={containerRef}>
        <AnimatePresence initial={false}>
          {danmakus.map((danmaku) => (
            <motion.div
              key={danmaku.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="danmaku-item"
            >
              <div
                className="danmaku-avatar"
                style={{ background: `linear-gradient(135deg, #${danmaku.avatar}, #${danmaku.avatar}aa)` }}
              >
                {danmaku.nickname.charAt(0)}
              </div>
              <div className="danmaku-content">
                <div className="danmaku-nickname">{danmaku.nickname}</div>
                <div className="danmaku-text">{danmaku.content}</div>
                <div className="danmaku-time">{formatTime(danmaku.timestamp)}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DanmakuPanel;
