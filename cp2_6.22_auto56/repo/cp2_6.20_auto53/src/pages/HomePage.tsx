import { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import AuctionCard from '@/components/AuctionCard';
import { useAuctionStore, selectFilteredItems } from '@/stores/auctionStore';

export default function HomePage() {
  const loading = useAuctionStore((s) => s.loading);
  const initialized = useAuctionStore((s) => s.initialized);
  const fetchItems = useAuctionStore((s) => s.fetchItems);
  const items = useAuctionStore((s) => s.items);
  const filter = useAuctionStore((s) => s.filter);

  const filteredItems = useMemo(() => {
    return selectFilteredItems({ items, filter } as Parameters<typeof selectFilteredItems>[0]);
  }, [items, filter]);

  useEffect(() => {
    if (!initialized) {
      fetchItems();
    }
  }, [initialized, fetchItems]);

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
              marginBottom: '8px',
              letterSpacing: '0.02em',
            }}
          >
            珍品竞拍
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            发现稀世珍品，参与顶级拍卖
          </p>
        </header>

        <FilterBar />

        <div style={{ marginTop: '32px' }}>
          {loading ? (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                height: '60vh',
                color: '#c9a84c',
                fontFamily: "'Playfair Display', serif",
                fontSize: '18px',
              }}
            >
              正在加载珍品...
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                height: '50vh',
                color: '#888',
              }}
            >
              当前筛选条件下暂无拍品
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="masonry-grid" key="items-grid">
                {filteredItems.map((item, index) => (
                  <div className="masonry-item" key={item.id}>
                    <AuctionCard item={item} index={index} />
                  </div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
