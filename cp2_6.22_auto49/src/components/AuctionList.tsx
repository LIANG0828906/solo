import React, { useMemo, useState } from 'react';
import type { Auction, SortOrder } from '../types';

interface AuctionListProps {
  auctions: Auction[];
  onSelect: (auction: Auction) => void;
}

function formatCountdown(targetTime: number, status: Auction['status']): { text: string; urgent: boolean } {
  if (status === 'ended') {
    return { text: '已结束', urgent: false };
  }
  if (status === 'upcoming') {
    const diff = targetTime - Date.now();
    if (diff <= 0) return { text: '即将开始', urgent: false };
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) {
      return { text: `${hours}时${minutes}分后开始`, urgent: hours < 1 };
    }
    return { text: `${minutes}分后开始`, urgent: true };
  }
  const diff = targetTime - Date.now();
  if (diff <= 0) return { text: '00:00:00', urgent: true };
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  const urgent = diff < 60 * 60 * 1000;
  return {
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    urgent,
  };
}

const AuctionCard = React.memo(function AuctionCard({
  auction,
  onSelect,
  countdown,
}: {
  auction: Auction;
  onSelect: () => void;
  countdown: { text: string; urgent: boolean };
}) {
  const statusLabel =
    auction.status === 'active' ? '进行中' : auction.status === 'upcoming' ? '即将开始' : '已结束';

  return (
    <div className="auction-card" onClick={onSelect}>
      <div className="cover-wrap">
        <img src={auction.coverUrl} alt={auction.title} loading="lazy" />
        <span className={`status-tag ${auction.status}`}>{statusLabel}</span>
      </div>
      <div className="info">
        <div className="book-title" title={auction.title}>
          {auction.title}
        </div>
        <div className="book-author">作者：{auction.author}</div>
        <div className="price-row">
          <div className="current-price">
            <span className="currency">¥</span>
            {auction.currentPrice}
          </div>
          <div className={`countdown ${countdown.urgent ? 'urgent' : ''}`}>{countdown.text}</div>
        </div>
      </div>
    </div>
  );
});

const AuctionList: React.FC<AuctionListProps> = ({ auctions, onSelect }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('time-asc');
  const [, forceUpdate] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleAuctions = useMemo(() => {
    let list = auctions.filter((a) => a.status !== 'ended');
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(kw) ||
          a.author.toLowerCase().includes(kw)
      );
    }
    const sorted = [...list];
    if (sortOrder === 'price-asc') {
      sorted.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (sortOrder === 'price-desc') {
      sorted.sort((a, b) => b.currentPrice - a.currentPrice);
    } else {
      sorted.sort((a, b) => {
        const timeA = a.status === 'upcoming' ? a.startTime : a.endTime;
        const timeB = b.status === 'upcoming' ? b.startTime : b.endTime;
        return timeA - timeB;
      });
    }
    return sorted;
  }, [auctions, searchKeyword, sortOrder]);

  const endedCount = auctions.filter((a) => a.status === 'ended').length;

  return (
    <div>
      <div className="filter-bar">
        <div className="search-box" style={{ minWidth: 240 }}>
          <input
            type="text"
            placeholder="🔍 搜索书名或作者..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
          <option value="time-asc">⏱️ 剩余时间（最近结束优先）</option>
          <option value="price-asc">💰 价格（低→高）</option>
          <option value="price-desc">💰 价格（高→低）</option>
        </select>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          共 {visibleAuctions.length} 个进行中的拍卖{endedCount > 0 && `（${endedCount} 个已结束）`}
        </div>
      </div>

      {visibleAuctions.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <div>暂无匹配的拍卖，试试其他关键词吧</div>
        </div>
      ) : (
        <div className="auction-grid">
          {visibleAuctions.map((auction) => {
            const countdown =
              auction.status === 'upcoming'
                ? formatCountdown(auction.startTime, auction.status)
                : formatCountdown(auction.endTime, auction.status);
            return (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onSelect={() => onSelect(auction)}
                countdown={countdown}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuctionList;
