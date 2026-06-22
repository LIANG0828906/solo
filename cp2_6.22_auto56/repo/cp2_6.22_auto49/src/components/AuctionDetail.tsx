import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { Auction, BidRecord, User } from '../types';

interface AuctionDetailProps {
  auctionId: string;
  socket: Socket;
  currentUser: User;
  onBack: () => void;
  auctionsRef: React.MutableRefObject<Map<string, Auction>>;
  onUpdateAuction: (auction: Auction) => void;
}

function formatTime(ms: number): string {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function formatCountdown(targetTime: number, status: Auction['status']): {
  text: string;
  urgent: boolean;
  ended: boolean;
} {
  if (status === 'ended') {
    return { text: '00:00:00', urgent: false, ended: true };
  }
  if (status === 'upcoming') {
    const diff = targetTime - Date.now();
    if (diff <= 0) return { text: '即将开始', urgent: false, ended: false };
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return {
      text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      urgent: diff < 60 * 60 * 1000,
      ended: false,
    };
  }
  const diff = targetTime - Date.now();
  if (diff <= 0) return { text: '00:00:00', urgent: true, ended: true };
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  const urgent = diff < 60 * 60 * 1000;
  return {
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    urgent,
    ended: false,
  };
}

const AuctionDetail: React.FC<AuctionDetailProps> = ({
  auctionId,
  socket,
  currentUser,
  onBack,
  auctionsRef,
  onUpdateAuction,
}) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [btnState, setBtnState] = useState<'normal' | 'success' | 'error'>('normal');
  const [, forceUpdate] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const btnShakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const cached = auctionsRef.current.get(auctionId);
      if (cached) {
        setAuction(cached);
      }
      try {
        const res = await fetch(`/api/auctions/${auctionId}`);
        if (res.ok) {
          const data: Auction = await res.json();
          setAuction(data);
          auctionsRef.current.set(auctionId, data);
        }
      } catch (e) {
        console.error('加载拍卖详情失败:', e);
      }
      setLoading(false);
    };
    load();

    socket.emit('auction:subscribe', auctionId);
    const handleUpdate = (updated: Auction) => {
      if (updated.id === auctionId) {
        setAuction(updated);
        auctionsRef.current.set(auctionId, updated);
        onUpdateAuction(updated);
      }
    };
    socket.on(`auction:${auctionId}:updated`, handleUpdate);
    socket.on(`auction:${auctionId}:ended`, handleUpdate);
    socket.on('auction:bid', (data: { auction: Auction; bid: BidRecord }) => {
      if (data.auction.id === auctionId) {
        setAuction(data.auction);
        auctionsRef.current.set(auctionId, data.auction);
        onUpdateAuction(data.auction);
      }
    });
    socket.on('auction:ended', (ended: Auction) => {
      if (ended.id === auctionId) {
        setAuction(ended);
        auctionsRef.current.set(auctionId, ended);
        onUpdateAuction(ended);
      }
    });

    const responseHandler = (result: { success: boolean; auction?: Auction; error?: string }) => {
      if (!result.success) {
        setErrorMsg(result.error || '出价失败');
        setBtnState('error');
        if (btnShakeTimer) clearTimeout(btnShakeTimer.current!);
        btnShakeTimer.current = setTimeout(() => setBtnState('normal'), 500);
      } else {
        setSuccessMsg(`出价成功！当前最高价 ¥${result.auction?.currentPrice}`);
        setBidAmount('');
        setBtnState('success');
        if (btnCheckTimer) clearTimeout(btnCheckTimer.current!);
        btnCheckTimer.current = setTimeout(() => {
          setBtnState('normal');
          setSuccessMsg('');
        }, 1500);
      }
    };
    socket.on(`auction:bid:response:${auctionId}`, responseHandler);

    return () => {
      socket.emit('auction:unsubscribe', auctionId);
      socket.off(`auction:${auctionId}:updated`, handleUpdate);
      socket.off(`auction:${auctionId}:ended`, handleUpdate);
      socket.off(`auction:bid:response:${auctionId}`, responseHandler);
      if (btnShakeTimer.current) clearTimeout(btnShakeTimer.current);
      if (btnCheckTimer.current) clearTimeout(btnCheckTimer.current);
    };
  }, [auctionId, socket, auctionsRef, onUpdateAuction]);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBid = () => {
    if (!auction) return;
    setErrorMsg('');
    const amount = parseInt(bidAmount, 10);
    if (!bidAmount || isNaN(amount)) {
      setErrorMsg('请输入有效的出价金额');
      return;
    }
    const minBid = auction.currentPrice + 1;
    if (amount < minBid) {
      setErrorMsg(`出价必须至少为 ¥${minBid}`);
      setBtnState('error');
      if (btnShakeTimer.current) clearTimeout(btnShakeTimer.current);
      btnShakeTimer.current = setTimeout(() => setBtnState('normal'), 500);
      return;
    }
    if (auction.sellerId === currentUser.id) {
      setErrorMsg('不能对自己发布的商品出价');
      return;
    }
    socket.emit('auction:bid', {
      auctionId: auction.id,
      userId: currentUser.id,
      amount,
    });
  };

  if (loading && !auction) {
    return <div className="loading">正在加载拍卖详情...</div>;
  }
  if (!auction) {
    return (
      <div className="info-section">
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
          <div>拍卖不存在或已被删除</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onBack}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const countdownTarget = auction.status === 'upcoming' ? auction.startTime : auction.endTime;
  const countdown = formatCountdown(countdownTarget, auction.status);
  const statusLabel =
    auction.status === 'active' ? '进行中' : auction.status === 'upcoming' ? '即将开始' : '已结束';

  const sortedHistory = [...auction.bidHistory].sort((a, b) => b.timestamp - a.timestamp);
  const highestBid = auction.bidHistory.length > 0
    ? auction.bidHistory[auction.bidHistory.length - 1]
    : null;

  const minBid = auction.currentPrice + 1;
  const numInput = parseInt(bidAmount, 10);
  const inputError = bidAmount && (!isNaN(numInput) && numInput < minBid);
  const isOwner = auction.sellerId === currentUser.id;

  const bidBtnClass = `btn bid-btn ${
    btnState === 'success'
      ? 'btn-success btn-check-animate'
      : btnState === 'error'
      ? 'btn-error btn-shake'
      : 'btn-primary'
  }`;

  const btnText =
    btnState === 'success' ? '✓ 出价成功' : btnState === 'error' ? '出价失败' : '立即出价';

  return (
    <div>
      <div className="back-btn" onClick={onBack}>
        ← 返回拍卖列表
      </div>
      <div style={{ height: 16 }} />

      <div className="detail-layout">
        <div className="image-col">
          <img className="cover-img" src={auction.coverUrl} alt={auction.title} />
        </div>

        <div className="info-col">
          <div className="info-section">
            <span className={`status-badge ${auction.status}`}>{statusLabel}</span>
            <h1 className="book-title-big">{auction.title}</h1>
            <div className="book-author-big">作者：{auction.author}</div>
            <div className="seller-info">卖家：{auction.sellerNickname}</div>

            <div className="price-display">
              <div className="price-item">
                <span className="label">起拍价</span>
                <span className="value">¥{auction.startPrice}</span>
              </div>
              <div className="price-item">
                <span className="label">当前最高价</span>
                <span className="value big">¥{auction.currentPrice}</span>
              </div>
              {highestBid && (
                <div className="price-item">
                  <span className="label">最高出价人</span>
                  <span className="value" style={{ fontSize: 16 }}>
                    {highestBid.nickname}
                  </span>
                </div>
              )}
            </div>

            {auction.status === 'ended' ? (
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: auction.winnerId ? 'rgba(76,175,80,0.08)' : 'rgba(158,158,158,0.08)', marginBottom: 16 }}>
                {auction.winnerId ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--success)', marginBottom: 6 }}>
                      🎉 拍卖已成交
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      成交价格：<span style={{ fontWeight: 700, color: 'var(--accent-dark)' }}>¥{auction.finalPrice}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                      赢家：<span style={{ fontWeight: 600 }}>{auction.winnerNickname}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#757575', marginBottom: 6 }}>
                      ⚠️ 流拍
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      拍卖结束前无人出价，本商品流拍
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className={`countdown-big ${countdown.urgent ? 'urgent' : ''}`}>
                  <span className="label">
                    {auction.status === 'upcoming' ? '距开始还有' : '距结束还有'}
                  </span>
                  <span className="time">{countdown.text}</span>
                </div>

                {isOwner ? (
                  <div style={{ padding: 14, background: 'rgba(158,158,158,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    这是您发布的拍卖，无法对自己的商品出价
                  </div>
                ) : auction.status === 'upcoming' ? (
                  <div style={{ padding: 14, background: 'rgba(158,158,158,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    拍卖尚未开始，稍后再来出价吧～
                  </div>
                ) : (
                  <div className="bid-section">
                    <div className="input-row">
                      <input
                        ref={inputRef}
                        type="number"
                        min={minBid}
                        step={1}
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          setErrorMsg('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleBid();
                        }}
                        placeholder={`最低出价 ¥${minBid}`}
                        className={inputError ? 'error' : ''}
                        disabled={btnState === 'success'}
                      />
                      <button
                        className={bidBtnClass}
                        onClick={handleBid}
                        disabled={auction.status !== 'active' || btnState === 'success'}
                      >
                        {btnText}
                      </button>
                    </div>
                    {errorMsg && <div className="error-msg">⚠️ {errorMsg}</div>}
                    {successMsg && <div className="success-msg">✓ {successMsg}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      账户余额：<span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>¥{currentUser.balance}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="info-section">
            <div className="section-title">📖 书籍描述</div>
            <div className="description-text">{auction.description || '卖家暂未填写书籍描述'}</div>
          </div>

          <div className="info-section">
            <div className="section-title">
              📋 出价历史
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                共 {auction.bidHistory.length} 条出价
              </span>
            </div>
            {sortedHistory.length === 0 ? (
              <div className="empty-state">暂无出价，快来成为第一位出价者！</div>
            ) : (
              <div className="bid-history">
                {sortedHistory.map((bid, idx) => (
                  <div
                    key={bid.id}
                    className={`bid-item ${idx === 0 && auction.status !== 'ended' ? 'highest' : ''}`}
                  >
                    <div className="bidder">
                      <span className="nickname">
                        {bid.nickname}
                        {idx === 0 && auction.status !== 'ended' && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--success)' }}>
                            👑 领先
                          </span>
                        )}
                      </span>
                      <span className="time">{formatTime(bid.timestamp)}</span>
                    </div>
                    <div className="bid-amount">¥{bid.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
