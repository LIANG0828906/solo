import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../stores/dashboardStore';
import './GiftPanel.css';

const GiftPanel: React.FC = () => {
  const giftRecords = useDashboardStore((state) => state.giftRecords);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [giftRecords]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="gift-panel">
      <div className="panel-header">
        <h3>礼物动态</h3>
        <span className="gift-count">{giftRecords.length}</span>
      </div>
      <div className="gift-list" ref={containerRef}>
        <AnimatePresence initial={false}>
          {giftRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: 'ease-out' }}
              className="gift-item"
            >
              <div className="gift-glow" />
              <div
                className="gift-avatar"
                style={{ background: `linear-gradient(135deg, #${record.avatar}, #${record.avatar}aa)` }}
              >
                {record.nickname.charAt(0)}
              </div>
              <div className="gift-info">
                <div className="gift-nickname">{record.nickname}</div>
                <div className="gift-detail">
                  <img src={record.gift.iconUrl} alt={record.gift.name} className="gift-icon" />
                  <span className="gift-name">{record.gift.name}</span>
                  <span className="gift-count-num">x{record.count}</span>
                </div>
                <div className="gift-time">{formatTime(record.timestamp)}</div>
              </div>
              <div className="gift-price">
                ¥{(record.gift.price * record.count).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GiftPanel;
