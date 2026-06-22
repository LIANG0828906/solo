import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuctionStore } from '../store/auctionStore';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function Countdown({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const tick = () => {
      const r = Math.max(0, endTime - Date.now());
      setRemaining(r);
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (remaining <= 0) {
    return <span style={{ color: '#999', fontSize: 12 }}>已结束</span>;
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 60000;
  const timeStr = mins > 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <span
      style={{
        fontSize: 12,
        color: isUrgent ? '#C62828' : '#888',
        animation: isUrgent ? 'blink 1s infinite' : 'none',
        fontWeight: isUrgent ? 700 : 400,
      }}
    >
      ⏱ {timeStr}
    </span>
  );
}

const PAGE_SIZE = 20;

export default function AuctionList() {
  const auctions = useAuctionStore((s) => s.auctions);
  const selectAuction = useAuctionStore((s) => s.selectAuction);
  const searchQuery = useAuctionStore((s) => s.searchQuery);
  const setSearchQuery = useAuctionStore((s) => s.setSearchQuery);

  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return auctions;
    const q = debouncedQuery.toLowerCase();
    return auctions.filter((a) => a.title.toLowerCase().includes(q));
  }, [auctions, debouncedQuery]);

  const visibleItems = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = visibleItems.length < filtered.length;

  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="搜索书名..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 16px',
            border: '2px solid #E0D8CC',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#A0522D')}
          onBlur={(e) => (e.target.style.borderColor = '#E0D8CC')}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
            fontSize: 16,
          }}
        >
          没有找到相关书籍
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {visibleItems.map((auction) => (
              <div
                key={auction.id}
                onClick={() => selectAuction(auction.id)}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div
                  style={{
                    height: 160,
                    background: auction.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 56,
                      fontWeight: 700,
                      color: '#fff',
                      opacity: 0.9,
                    }}
                  >
                    {auction.title[0]}
                  </span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    《{auction.title}》
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#A0522D', fontWeight: 600 }}>
                      ¥{auction.currentHighestBid}
                    </span>
                    <Countdown endTime={auction.endTime} />
                  </div>
                  <div>
                    <span
                      style={{
                        background: '#2E7D32',
                        color: '#fff',
                        padding: '2px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      一口价 ¥{auction.buyNowPrice}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div ref={loaderRef} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
              加载更多...
            </div>
          )}
        </>
      )}
    </div>
  );
}
