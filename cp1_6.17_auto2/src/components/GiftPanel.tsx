import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '../stores/dashboardStore';
import type { GiftRecord } from '../types';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const GiftPanel: React.FC = () => {
  const { giftRecords, fetchGiftRecords } = useDashboardStore();
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const prevIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchGiftRecords();
  }, [fetchGiftRecords]);

  useEffect(() => {
    const currentIds = new Set(giftRecords.map((r) => r.id));
    const newIds = new Set<string>();
    currentIds.forEach((id) => {
      if (!prevIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });

    if (newIds.size > 0) {
      setFlashingIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      setTimeout(() => {
        setFlashingIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 600);
    }

    prevIdsRef.current = currentIds;
  }, [giftRecords]);

  return (
    <div
      style={{
        width: 320,
        background: '#2D2D44',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 100px)',
        maxHeight: 600,
      }}
      className="card-hover"
    >
      <h3 style={{ color: '#E0E0E0', margin: '0 0 16px 0', fontSize: 18 }}>礼物动态</h3>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 8,
        }}
      >
        <AnimatePresence initial={false}>
          {giftRecords
            .slice()
            .reverse()
            .map((record: GiftRecord) => (
              <motion.div
                key={record.id}
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut',
                }}
                className={flashingIds.has(record.id) ? 'gold-flash' : ''}
                style={{
                  background: '#1E1E2E',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: flashingIds.has(record.id) ? '2px solid #FFD700' : '1px solid #444466',
                  flexShrink: 0,
                }}
              >
                <img
                  src={record.giftIcon}
                  alt={record.giftName}
                  style={{ width: 40, height: 40, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#E0E0E0', fontSize: 14, fontWeight: 500 }}>
                    {record.nickname}
                  </div>
                  <div style={{ color: '#FFD700', fontSize: 13 }}>
                    送出 {record.giftName} x{record.quantity}
                  </div>
                  <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
                    {formatTime(record.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GiftPanel;
