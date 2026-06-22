import React, { useEffect, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { Auction, BidRecord, User } from '../types';

interface UserProfileProps {
  user: User;
  socket: Socket;
  onSelectAuction: (auctionId: string) => void;
  auctionsRef: React.MutableRefObject<Map<string, Auction>>;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getBidResult(bid: BidRecord, auction: Auction | undefined): {
  label: string;
  className: string;
} {
  if (!auction) return { label: '未知', className: 'outbid' };
  if (auction.status === 'upcoming') return { label: '即将开始', className: 'active' };
  if (auction.status === 'active') {
    const highest = auction.bidHistory[auction.bidHistory.length - 1];
    if (highest && highest.userId === bid.userId && highest.amount === bid.amount) {
      return { label: '暂时领先', className: 'active' };
    }
    return { label: '已被超越', className: 'outbid' };
  }
  if (auction.status === 'ended') {
    if (!auction.winnerId) return { label: '流拍', className: 'ended' };
    if (auction.winnerId === bid.userId && auction.finalPrice === bid.amount) {
      return { label: '✓ 中标', className: 'won' };
    }
    return { label: '未中标', className: 'outbid' };
  }
  return { label: '未知', className: 'outbid' };
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  socket,
  onSelectAuction,
  auctionsRef,
}) => {
  const [selling, setSelling] = useState<Auction[]>([]);
  const [bidRecords, setBidRecords] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayUser, setDisplayUser] = useState<User>(user);

  const refreshAll = useCallback(async () => {
    try {
      const [sRes, bRes, uRes] = await Promise.all([
        fetch(`/api/users/${user.id}/auctions`),
        fetch(`/api/users/${user.id}/bids`),
        fetch(`/api/users/${user.id}`),
      ]);
      if (sRes.ok) {
        const sData: Auction[] = await sRes.json();
        setSelling(sData.sort((a, b) => {
          const orderA = a.status === 'active' ? 0 : a.status === 'upcoming' ? 1 : 2;
          const orderB = b.status === 'active' ? 0 : b.status === 'upcoming' ? 1 : 2;
          if (orderA !== orderB) return orderA - orderB;
          return b.endTime - a.endTime;
        }));
        sData.forEach((a) => auctionsRef.current.set(a.id, a));
      }
      if (bRes.ok) {
        setBidRecords(await bRes.json());
      }
      if (uRes.ok) {
        const uData: User = await uRes.json();
        setDisplayUser(uData);
      }
    } catch (e) {
      console.error('加载用户数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, [user.id, auctionsRef]);

  useEffect(() => {
    refreshAll();

    const handleAuctionsUpdated = () => {
      refreshAll();
    };
    const handleAuctionBid = () => {
      refreshAll();
    };
    const handleAuctionEnded = () => {
      refreshAll();
    };

    socket.on('auctions:updated', handleAuctionsUpdated);
    socket.on('auction:bid', handleAuctionBid);
    socket.on('auction:ended', handleAuctionEnded);

    return () => {
      socket.off('auctions:updated', handleAuctionsUpdated);
      socket.off('auction:bid', handleAuctionBid);
      socket.off('auction:ended', handleAuctionEnded);
    };
  }, [refreshAll, socket]);

  const activeCount = selling.filter((a) => a.status === 'active').length;
  const endedCount = selling.filter((a) => a.status === 'ended').length;
  const soldCount = selling.filter((a) => a.status === 'ended' && a.winnerId).length;
  const wonCount = bidRecords.filter((b) => {
    const a = auctionsRef.current.get(b.auctionId);
    return a && a.status === 'ended' && a.winnerId === b.userId && a.finalPrice === b.amount;
  }).length;

  const initial = displayUser.nickname.charAt(0);

  if (loading) {
    return <div className="loading">正在加载个人资料...</div>;
  }

  return (
    <div>
      <div className="profile-header">
        <div className="avatar">{initial}</div>
        <div className="user-info">
          <div className="nickname">{displayUser.nickname}</div>
          <div className="username">@{displayUser.username}</div>
          <div className="stats-row">
            <div className="stat">
              <span className="stat-label">信用评分</span>
              <span className="stat-value">⭐ {displayUser.creditScore}</span>
            </div>
            <div className="stat">
              <span className="stat-label">账户余额</span>
              <span className="stat-value">¥{displayUser.balance}</span>
            </div>
            <div className="stat">
              <span className="stat-label">在售</span>
              <span className="stat-value">{activeCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">已售出</span>
              <span className="stat-value">{soldCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">已中标</span>
              <span className="stat-value">{wonCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="info-section">
          <div className="section-title">
            📚 我发布的书籍
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
              共 {selling.length} 本
            </span>
          </div>
          {selling.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 36, marginBottom: 8 }}>📖</div>
              <div>您还没有发布任何书籍拍卖</div>
            </div>
          ) : (
            <div className="selling-list">
              {selling.map((auction) => {
                const statusLabel =
                  auction.status === 'active'
                    ? '进行中'
                    : auction.status === 'upcoming'
                    ? '即将开始'
                    : auction.winnerId
                    ? `已售出 ¥${auction.finalPrice}`
                    : '流拍';
                return (
                  <div
                    key={auction.id}
                    className="selling-item"
                    onClick={() => onSelectAuction(auction.id)}
                  >
                    <img className="thumb" src={auction.coverUrl} alt={auction.title} />
                    <div className="info">
                      <div className="title" title={auction.title}>
                        {auction.title}
                      </div>
                      <div className="meta">
                        <span>
                          {auction.author} · 当前 ¥{auction.currentPrice}
                        </span>
                        <span
                          style={{
                            color:
                              auction.status === 'active'
                                ? 'var(--success)'
                                : auction.status === 'upcoming'
                                ? '#757575'
                                : auction.winnerId
                                ? 'var(--accent)'
                                : '#9E9E9E',
                            fontWeight: 600,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="section-title">
            💰 我的出价记录
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
              共 {bidRecords.length} 条
            </span>
          </div>
          {bidRecords.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>
              <div>您还没有任何出价记录，快去参与拍卖吧！</div>
            </div>
          ) : (
            <div className="bid-record-list">
              {bidRecords.map((bid) => {
                const auction = auctionsRef.current.get(bid.auctionId);
                const result = getBidResult(bid, auction);
                return (
                  <div
                    key={bid.id}
                    className="bid-record"
                    onClick={() => onSelectAuction(bid.auctionId)}
                  >
                    <div className="top-row">
                      <div className="auction-title" title={auction?.title || '已删除的拍卖'}>
                        {auction?.title || '已删除的拍卖'}
                      </div>
                      <div className="amount">¥{bid.amount}</div>
                    </div>
                    <div className="bottom-row">
                      <span>{formatDate(bid.timestamp)}</span>
                      <span className={`result-badge ${result.className}`}>{result.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
