import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Gavel, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AuctionItem } from '@/types';
import { CategoryLabel } from '@/types';
import { formatPrice, formatCountdown, isEndingSoon } from '@/utils/formatters';
import { useAuctionStore } from '@/stores/auctionStore';

interface AuctionCardProps {
  item: AuctionItem;
  index: number;
}

export default function AuctionCard({ item, index }: AuctionCardProps) {
  const navigate = useNavigate();
  const toggleFavorite = useAuctionStore((s) => s.toggleFavorite);
  const isFavorite = useAuctionStore((s) => s.isFavorite(item.id));
  const [countdown, setCountdown] = useState(formatCountdown(item.endTime));
  const endingSoon = isEndingSoon(item.endTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(item.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [item.endTime]);

  const handleCardClick = () => {
    navigate(`/detail/${item.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className="glass-card cursor-pointer overflow-hidden"
      style={{ borderRadius: '16px' }}
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        <motion.div
          whileHover={{
            scale: 1.08,
            y: -4,
            filter: 'brightness(1.05)',
          }}
          transition={{ duration: 0.35 }}
          style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}
        >
          <img
            src={item.thumbnail}
            alt={item.name}
            style={{
              width: '100%',
              objectFit: 'cover',
              aspectRatio: '4 / 3',
              display: 'block',
            }}
          />
        </motion.div>

        <div
          className="absolute right-3 bottom-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.button
              key={isFavorite ? 'filled' : 'outline'}
              initial={{ scale: 0.6 }}
              animate={{ scale: [0.6, 1.1, 1] }}
              exit={{ scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 14 }}
              onClick={handleFavoriteClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                backdropFilter: 'blur(4px)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              }}
              aria-label="收藏"
            >
              <Heart
                size={18}
                color="#fff"
                fill={isFavorite ? '#fff' : 'none'}
                strokeWidth={2}
              />
            </motion.button>
          </AnimatePresence>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <h3
          style={{
            fontWeight: 700,
            color: '#c9a84c',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '17px',
            lineHeight: 1.3,
            margin: 0,
            marginBottom: '12px',
          }}
        >
          {item.name}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <Gavel size={16} color="#c9a84c" />
          <span
            style={{
              color: '#c9a84c',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.01em',
            }}
          >
            {formatPrice(item.currentPrice)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: endingSoon ? '#ef4444' : '#9ca3af',
              fontWeight: endingSoon ? 600 : 400,
            }}
          >
            剩余 {countdown}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#888',
              fontSize: '11px',
            }}
          >
            <Users size={13} />
            <span>出价人数：{item.bidCount}人</span>
          </div>
          <span className="category-tag">
            {CategoryLabel[item.category]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
