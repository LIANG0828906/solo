import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Users, Clock, Gavel, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ImageModal from '@/components/ImageModal';
import BidInput from '@/components/BidInput';
import { useAuctionStore } from '@/stores/auctionStore';
import { CategoryLabel } from '@/types';
import {
  formatFullPrice,
  formatCountdown,
  isEndingSoon,
  formatPrice,
} from '@/utils/formatters';

export default function DetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = useAuctionStore((s) => s.items.find((i) => i.id === id));
  const toggleFavorite = useAuctionStore((s) => s.toggleFavorite);
  const isFavorite = useAuctionStore((s) => s.isFavorite(id));
  const fetchItems = useAuctionStore((s) => s.fetchItems);
  const initialized = useAuctionStore((s) => s.initialized);

  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(item ? formatCountdown(item.endTime) : '');

  useEffect(() => {
    if (!initialized) {
      fetchItems();
    }
  }, [initialized, fetchItems]);

  useEffect(() => {
    if (!item) return;
    setCountdown(formatCountdown(item.endTime));
    const timer = setInterval(() => {
      setCountdown(formatCountdown(item.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [item]);

  if (!item) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#1a2332' }}>
        <Navbar />
        <main
          style={{
            marginLeft: '220px',
            padding: '80px 40px',
            flex: 1,
            color: '#888',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          未找到该拍品
        </main>
      </div>
    );
  }

  const endingSoon = isEndingSoon(item.endTime);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      <Navbar />
      <main
        className="flex-1 overflow-auto"
        style={{
          marginLeft: '220px',
          padding: '28px 40px 60px',
        }}
      >
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: '#c9a84c',
            cursor: 'pointer',
            padding: '8px 0',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          <ArrowLeft size={18} />
          返回列表
        </motion.button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
            gap: '40px',
            alignItems: 'start',
          }}
          className="detail-grid"
        >
          <div>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass-card overflow-hidden cursor-zoom-in"
              style={{ position: 'relative', borderRadius: '16px' }}
              onClick={() => setShowModal(true)}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'cover',
                  aspectRatio: '4 / 3',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '16px',
                }}
              >
                <span className="category-tag">{CategoryLabel[item.category]}</span>
              </div>
            </motion.div>

            <div style={{ marginTop: '24px' }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#c9a84c',
                  margin: 0,
                  marginBottom: '12px',
                }}
              >
                {item.name}
              </h2>
              <p
                style={{
                  color: '#ccc',
                  lineHeight: 1.8,
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                {item.description}
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '28px', borderRadius: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                  当前最高出价
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '36px',
                    fontWeight: 700,
                    color: '#c9a84c',
                    letterSpacing: '0.01em',
                  }}
                >
                  {formatFullPrice(item.currentPrice)}
                </div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                  起拍价 {formatPrice(item.startPrice)}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.button
                  key={isFavorite ? 'filled' : 'outline'}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: [0.6, 1.15, 1] }}
                  exit={{ scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                  onClick={() => toggleFavorite(item.id)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isFavorite ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  aria-label="收藏"
                >
                  <Heart
                    size={22}
                    color={isFavorite ? '#fff' : '#c9a84c'}
                    fill={isFavorite ? '#fff' : 'none'}
                  />
                </motion.button>
              </AnimatePresence>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '20px',
                padding: '16px 0',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#888" />
                <span style={{ color: '#ccc', fontSize: '13px' }}>
                  {item.bidCount} 人出价
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color={endingSoon ? '#ef4444' : '#888'} />
                <span
                  style={{
                    color: endingSoon ? '#ef4444' : '#ccc',
                    fontSize: '13px',
                    fontWeight: endingSoon ? 600 : 400,
                  }}
                >
                  剩余 {countdown}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  color: '#888',
                  fontSize: '13px',
                }}
              >
                <User size={15} />
                <span>领先者：{item.highestBidder}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#888',
                  fontSize: '13px',
                }}
              >
                <Gavel size={15} />
                <span>起拍价 {formatFullPrice(item.startPrice)}</span>
              </div>
            </div>

            <BidInput itemId={item.id} currentPrice={item.currentPrice} />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <ImageModal imageSrc={item.image} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 960px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
