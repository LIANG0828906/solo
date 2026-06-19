import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import type { Item, DistanceFilter, ItemStatus } from '../../types';

const statusConfig: Record<ItemStatus, { label: string; bg: string }> = {
  available: { label: '可交换', bg: '#2ECC71' },
  reserved: { label: '已被约', bg: '#F39C12' },
  exchanged: { label: '已交换', bg: '#95A5A6' },
};

const filterOptions: { value: DistanceFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '1km', label: '1km内' },
  { value: '3km', label: '3km内' },
  { value: '5km', label: '5km内' },
];

interface ItemCardProps {
  item: Item;
  index: number;
  onClick: () => void;
}

function ItemCard({ item, index, onClick }: ItemCardProps) {
  const isDisabled = item.status !== 'available';

  const getTimeLabel = useCallback(() => {
    const diff = Date.now() - item.publishTime.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }, [item.publishTime]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: 200,
        height: 280,
        borderRadius: 12,
        background: '#fff',
        position: 'relative',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      whileHover={isDisabled ? {} : { y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
    >
      {isDisabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        />
      )}

      <div
        style={{
          width: '100%',
          height: 140,
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#333',
            marginBottom: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(74, 144, 217, 0.15)',
              color: '#4A90D9',
            }}
          >
            {item.category}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.08)',
              color: '#666',
            }}
          >
            {item.distance}km
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#999',
          }}
        >
          {getTimeLabel()}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          padding: '3px 10px',
          borderRadius: 12,
          background: statusConfig[item.status].bg,
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {statusConfig[item.status].label}
      </div>
    </motion.div>
  );
}

interface ExchangeBoardProps {
  onItemClick: (item: Item) => void;
}

export function ExchangeBoard({ onItemClick }: ExchangeBoardProps) {
  const { currentUser, users, getFilteredItems, distanceFilter, setDistanceFilter } = useStore();
  const [visibleCount, setVisibleCount] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => getFilteredItems(), [getFilteredItems]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const topUsers = useMemo(() => {
    return [...users].sort((a, b) => b.carbonPoints - a.carbonPoints).slice(0, 5);
  }, [users]);

  useEffect(() => {
    setVisibleCount(20);
  }, [distanceFilter]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (visibleCount < filteredItems.length) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredItems.length));
      }
    }
  }, [filteredItems.length, visibleCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {filterOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setDistanceFilter(option.value)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                height: 32,
                padding: '0 16px',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: distanceFilter === option.value ? '#4A90D9' : 'rgba(255,255,255,0.1)',
                color: distanceFilter === option.value ? '#fff' : '#E0E0E0',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 200px)',
            gap: 16,
            justifyContent: 'flex-start',
          }}
        >
          <AnimatePresence>
            {visibleItems.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => onItemClick(item)}
              />
            ))}
          </AnimatePresence>
        </div>

        {visibleCount < filteredItems.length && (
          <div
            style={{
              textAlign: 'center',
              padding: 20,
              color: '#95A5A6',
              fontSize: 13,
            }}
          >
            加载中...
          </div>
        )}
      </div>

      <div
        style={{
          width: 280,
          background: '#1A2634CC',
          backdropFilter: 'blur(8px)',
          padding: 20,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#95A5A6', fontSize: 13, marginBottom: 8 }}>
            我的碳积分
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#2ECC71',
            }}
          >
            {currentUser.carbonPoints}
          </div>
          <div style={{ color: '#95A5A6', fontSize: 11, marginTop: 4 }}>
            累计交换 {currentUser.exchangeCount} 次
          </div>
        </div>

        <div>
          <div
            style={{
              color: '#E0E0E0',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            🏆 排行榜 TOP 5
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 8,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 11,
                    background:
                      index === 0
                        ? '#FFD700'
                        : index === 1
                        ? '#C0C0C0'
                        : index === 2
                        ? '#CD7F32'
                        : 'rgba(255,255,255,0.1)',
                    color: index < 3 ? '#333' : '#E0E0E0',
                    marginRight: 10,
                  }}
                >
                  {index + 1}
                </div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#ddd',
                    marginRight: 8,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#E0E0E0' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 13, color: '#2ECC71', fontWeight: 500 }}>
                  {user.carbonPoints}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
