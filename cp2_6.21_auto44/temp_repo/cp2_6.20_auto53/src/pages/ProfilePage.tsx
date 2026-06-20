import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import FavoriteCard from '@/components/FavoriteCard';
import TimelineItem from '@/components/TimelineItem';
import { useAuctionStore } from '@/stores/auctionStore';
import type { BidRecord } from '@/types';

const CARD_STAGGER_DELAY = 0.08;

export default function ProfilePage() {
  const initialized = useAuctionStore((s) => s.initialized);
  const fetchItems = useAuctionStore((s) => s.fetchItems);
  const items = useAuctionStore((s) => s.items);
  const rawFavorites = useAuctionStore((s) => s.favorites);
  const bidHistory = useAuctionStore((s) => s.bidHistory);
  const reorderFavorites = useAuctionStore((s) => s.reorderFavorites);
  const currentUser = useAuctionStore((s) => s.currentUser);

  const favorites = useMemo(
    () => [...rawFavorites].sort((a, b) => a.order - b.order),
    [rawFavorites],
  );

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [recentStatusIds, setRecentStatusIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!initialized) {
      fetchItems();
    }
  }, [initialized, fetchItems]);

  const favoriteItems = favorites
    .map((f) => ({ fav: f, item: items.find((it) => it.id === f.itemId) }))
    .filter((e): e is { fav: typeof favorites[number]; item: typeof items[number] } => !!e.item);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingIndex !== null && draggingIndex !== index) {
      reorderFavorites(draggingIndex, index);
      setDraggingIndex(index);
    }
  };

  const handleDrop = () => {
    setDraggingIndex(null);
  };

  useEffect(() => {
    if (bidHistory.length === 0) return;
    const ids = new Set<string>();
    bidHistory.slice(0, 3).forEach((b: BidRecord) => ids.add(b.id));
    setRecentStatusIds(ids);
    const t = setTimeout(() => setRecentStatusIds(new Set()), 3600);
    return () => clearTimeout(t);
  }, [bidHistory.length]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#1a2332' }}>
      <Navbar />
      <main
        className="flex-1 overflow-auto"
        style={{
          marginLeft: '220px',
          padding: '32px 40px 60px',
        }}
      >
        <header className="mb-8">
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '36px',
              fontWeight: 700,
              color: '#c9a84c',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            个人中心
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            欢迎回来，{currentUser}
          </p>
        </header>

        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '22px',
                color: '#c9a84c',
                margin: 0,
              }}
            >
              我的收藏
            </h2>
            <span style={{ color: '#888', fontSize: '12px' }}>
              共 {favoriteItems.length} 件 · 拖拽可调整顺序
            </span>
          </div>

          {favoriteItems.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#888',
              }}
            >
              还没有收藏任何拍品
            </div>
          ) : (
            <div className="scroll-x-container">
              {favoriteItems.map(({ fav, item }, idx) => (
                <div
                  key={fav.id}
                  draggable
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDrop}
                  style={{ opacity: draggingIndex === idx ? 0.4 : 1 }}
                >
                  <FavoriteCard
                    item={item}
                    index={idx}
                    delay={idx * CARD_STAGGER_DELAY}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '22px',
                color: '#c9a84c',
                margin: 0,
              }}
            >
              竞拍历史
            </h2>
            <span style={{ color: '#888', fontSize: '12px' }}>
              共 {bidHistory.length} 条记录
            </span>
          </div>

          {bidHistory.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#888',
              }}
            >
              暂无竞拍记录
            </div>
          ) : (
            <motion.div
              className="glass-card"
              style={{ padding: '28px', borderRadius: '16px', maxWidth: '720px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {bidHistory.map((bid, idx) => (
                <TimelineItem
                  key={bid.id}
                  bidRecord={bid}
                  isNew={recentStatusIds.has(bid.id) && idx < 3}
                />
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
