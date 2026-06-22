import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useGameStore } from '../store/gameStore';
import EquipmentCard from './EquipmentCard';
import {
  Listing,
  Equipment,
  RARITY_COLORS,
  RARITY_LABELS,
  Rarity,
} from '../types';
import {
  formatTimeRemaining,
  getTimeRemaining,
  getBidStep,
} from '../engine/EquipmentMarket';

const MarketPanel: React.FC = () => {
  const {
    listings,
    playerId,
    setBidModalListing,
    tradeHistoryOpen,
    setTradeHistoryOpen,
    tradeRecords,
  } = useGameStore();

  const tickMarket = useGameStore(s => s.tickMarket);

  useEffect(() => {
    const interval = setInterval(() => {
      tickMarket();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickMarket]);

  const activeListings = useMemo(
    () => listings.filter(l => l.status === 'active'),
    [listings]
  );

  const completedListings = useMemo(
    () => listings.filter(l => l.status === 'completed'),
    [listings]
  );

  const stats = useMemo(() => {
    const completedTrades = tradeRecords;
    const totalVolume = completedTrades.length;
    const avgPrice = totalVolume > 0
      ? Math.round(completedTrades.reduce((s, t) => s + t.finalPrice, 0) / totalVolume)
      : 0;
    const rarityDist: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    completedTrades.forEach(t => { rarityDist[t.equipment.rarity] += 1; });
    return { totalVolume, avgPrice, rarityDist };
  }, [tradeRecords]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontFamily: 'Orbitron, sans-serif', color: '#58a6ff' }}>
          虚拟市场
        </h2>
        <StatsPanel stats={stats} />
      </div>

      <div style={{ flex: 1, minHeight: 0, border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
        {activeListings.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            暂无活跃挂单
          </div>
        ) : (
          <ListingList listings={activeListings} playerId={playerId} onBid={setBidModalListing} />
        )}
      </div>

      <button
        onClick={() => setTradeHistoryOpen(!tradeHistoryOpen)}
        style={{
          padding: '8px 16px',
          background: '#1c2331',
          border: '1px solid #30363d',
          borderRadius: 8,
          color: '#8b949e',
          fontSize: 12,
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        {tradeHistoryOpen ? '隐藏' : '查看'}成交记录 ({tradeRecords.length})
      </button>

      {tradeHistoryOpen && (
        <TradeHistory records={tradeRecords} />
      )}
    </div>
  );
};

const ListingList: React.FC<{
  listings: Listing[];
  playerId: string;
  onBid: (listing: Listing) => void;
}> = ({ listings, playerId, onBid }) => {
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const listing = listings[index];
    return (
      <div style={style}>
        <ListingRow listing={listing} playerId={playerId} onBid={onBid} />
      </div>
    );
  }, [listings, playerId, onBid]);

  return (
    <List
      height={Math.min(listings.length * 72, 400)}
      itemCount={listings.length}
      itemSize={72}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </List>
  );
};

const ListingRow: React.FC<{
  listing: Listing;
  playerId: string;
  onBid: (listing: Listing) => void;
}> = ({ listing, playerId, onBid }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(listing.endTime));
  const rarityColor = RARITY_COLORS[listing.equipment.rarity];
  const isOwner = listing.sellerId === playerId;
  const isLeading = listing.highestBidderId === playerId;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(listing.endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [listing.endTime]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #30363d',
        background: '#1c233180',
        backdropFilter: 'blur(6px)',
        gap: 10,
      }}
    >
      <div style={{ width: 6, height: 40, borderRadius: 3, background: rarityColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: rarityColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {listing.equipment.itemName}
        </div>
        <div style={{ fontSize: 11, color: '#8b949e' }}>
          {RARITY_LABELS[listing.equipment.rarity]} · {isOwner ? '你的挂单' : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: '#f5a623', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
          {listing.currentPrice} ¢
        </div>
        <div style={{ fontSize: 11, color: timeLeft < 30000 ? '#f85149' : '#8b949e' }}>
          {formatTimeRemaining(timeLeft)}
        </div>
      </div>
      {!isOwner && listing.status === 'active' && timeLeft > 0 && (
        <button
          onClick={() => onBid(listing)}
          style={{
            padding: '4px 12px',
            background: isLeading ? '#1a3a2a' : '#1a2a4a',
            border: `1px solid ${isLeading ? '#3fb950' : '#58a6ff'}`,
            borderRadius: 6,
            color: isLeading ? '#3fb950' : '#58a6ff',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {isLeading ? '已领先' : '竞价'}
        </button>
      )}
      {isOwner && listing.status === 'active' && (
        <span style={{ fontSize: 11, color: '#8b949e', flexShrink: 0 }}>挂单中</span>
      )}
    </div>
  );
};

const StatsPanel: React.FC<{
  stats: { totalVolume: number; avgPrice: number; rarityDist: Record<Rarity, number> };
}> = ({ stats }) => {
  const maxCount = Math.max(1, ...Object.values(stats.rarityDist));
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: '#8b949e' }}>
      <span>交易量: {stats.totalVolume}</span>
      <span>|</span>
      <span>均价: {stats.avgPrice}¢</span>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
        {(Object.entries(stats.rarityDist) as [Rarity, number][]).map(([r, c]) => (
          <div
            key={r}
            title={`${RARITY_LABELS[r]}: ${c}`}
            style={{
              width: 8,
              height: Math.max(2, (c / maxCount) * 20),
              background: RARITY_COLORS[r],
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const TradeHistory: React.FC<{
  records: { id: string; equipment: Equipment; finalPrice: number; buyerId: string; sellerId: string; completedAt: number }[];
}> = ({ records }) => {
  return (
    <div style={{
      background: '#0d1117',
      borderRadius: 8,
      border: '1px solid #30363d',
      maxHeight: 200,
      overflow: 'auto',
    }}>
      {records.slice(0, 20).map((r, i) => {
        const rarityColor = RARITY_COLORS[r.equipment.rarity];
        const timeStr = new Date(r.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        return (
          <div
            key={r.id}
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: i < 19 ? '1px solid #30363d' : 'none',
              background: i % 2 === 0 ? '#0d1117' : '#161b22',
              fontSize: 12,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: rarityColor }} />
            <span style={{ color: rarityColor, flex: 1 }}>{r.equipment.itemName}</span>
            <span style={{ color: '#f5a623' }}>{r.finalPrice}¢</span>
            <span style={{ color: '#8b949e' }}>
              {r.sellerId.slice(0, 3)}→{r.buyerId.slice(0, 3)}
            </span>
            <span style={{ color: '#8b949e' }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MarketPanel;
