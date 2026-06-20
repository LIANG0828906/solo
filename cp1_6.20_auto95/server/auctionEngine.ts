import { v4 as uuidv4 } from 'uuid';
import type { Artwork, BoxSeries, User, Auction, Bid, Transaction, Notification } from '../shared/types';
import {
  getSeriesById,
  updateSeries,
  getUserById,
  updateUser,
  getAuctionById,
  updateAuction,
  addTransaction,
  addNotification,
  getArtworkById
} from './dataStore';

export async function buyBox(seriesId: string, userId: string): Promise<{ artwork: Artwork; newBalance: number } | { error: string }> {
  const series = await getSeriesById(seriesId);
  if (!series) return { error: '系列不存在' };

  const availableArtworks = series.artworks.filter(a => {
    return true;
  });

  const remaining = series.totalCount - series.soldCount;
  if (remaining <= 0) return { error: '该系列已售罄' };

  const user = await getUserById(userId);
  if (!user) return { error: '用户不存在' };
  if (user.balance < series.price) return { error: '余额不足' };

  const randomIdx = Math.floor(Math.random() * availableArtworks.length);
  const selectedArtwork = availableArtworks[randomIdx];

  user.balance -= series.price;
  if (!user.collection.includes(selectedArtwork.id)) {
    user.collection.push(selectedArtwork.id);
  }
  await updateUser(user);

  series.soldCount += 1;
  await updateSeries(series);

  const buyTx: Transaction = {
    id: uuidv4(),
    type: 'box_purchase',
    userId,
    userName: user.name,
    artworkId: selectedArtwork.id,
    artworkCode: selectedArtwork.code,
    amount: series.price,
    timestamp: Date.now()
  };
  await addTransaction(buyTx);

  return { artwork: selectedArtwork, newBalance: user.balance };
}

export async function createAuction(
  artworkId: string,
  sellerId: string,
  startingPrice: number,
  duration: 24 | 48 | 72
): Promise<Auction | { error: string }> {
  const user = await getUserById(sellerId);
  if (!user) return { error: '用户不存在' };
  if (!user.collection.includes(artworkId)) return { error: '您不拥有该作品' };

  const artwork = await getArtworkById(artworkId);
  if (!artwork) return { error: '作品不存在' };

  const startTime = Date.now();
  const endTime = startTime + duration * 60 * 60 * 1000;

  const auction: Auction = {
    id: uuidv4(),
    artworkId,
    sellerId,
    sellerName: user.name,
    startingPrice,
    currentPrice: startingPrice,
    highestBidderId: null,
    highestBidderName: null,
    startTime,
    endTime,
    duration,
    bids: [],
    status: 'active'
  };

  await updateAuction(auction);
  return auction;
}

export async function placeBid(
  auctionId: string,
  userId: string,
  amount: number
): Promise<Auction | { error: string }> {
  const auction = await getAuctionById(auctionId);
  if (!auction) return { error: '拍卖不存在' };
  if (auction.status === 'ended') return { error: '拍卖已结束' };
  if (Date.now() >= auction.endTime) {
    auction.status = 'ended';
    await updateAuction(auction);
    await finalizeAuction(auction);
    return { error: '拍卖已结束' };
  }
  if (amount <= auction.currentPrice) return { error: '出价必须高于当前价格' };

  const bidder = await getUserById(userId);
  if (!bidder) return { error: '用户不存在' };
  if (bidder.balance < amount) return { error: '余额不足' };
  if (auction.sellerId === userId) return { error: '不能竞拍自己的作品' };

  const now = Date.now();
  const timeLeft = auction.endTime - now;
  const FIVE_MIN = 5 * 60 * 1000;
  if (timeLeft < FIVE_MIN) {
    auction.endTime = now + FIVE_MIN;
  }

  const bid: Bid = {
    id: uuidv4(),
    userId,
    userName: bidder.name,
    amount,
    timestamp: now
  };

  auction.bids.push(bid);
  auction.currentPrice = amount;
  auction.highestBidderId = userId;
  auction.highestBidderName = bidder.name;

  await updateAuction(auction);
  return auction;
}

export async function finalizeAuction(auction: Auction): Promise<void> {
  if (auction.status !== 'ended') {
    auction.status = 'ended';
    await updateAuction(auction);
  }

  const seller = await getUserById(auction.sellerId);
  if (!seller) return;

  if (auction.highestBidderId && auction.bids.length > 0) {
    const winner = await getUserById(auction.highestBidderId);
    if (winner) {
      winner.balance -= auction.currentPrice;
      if (!winner.collection.includes(auction.artworkId)) {
        winner.collection.push(auction.artworkId);
      }
      await updateUser(winner);

      const winTx: Transaction = {
        id: uuidv4(),
        type: 'auction_win',
        userId: winner.id,
        userName: winner.name,
        artworkId: auction.artworkId,
        auctionId: auction.id,
        amount: auction.currentPrice,
        timestamp: Date.now()
      };
      await addTransaction(winTx);

      const winNotif: Notification = {
        id: uuidv4(),
        userId: winner.id,
        title: '🎉 竞拍成功!',
        message: `您以 ¥${auction.currentPrice} 赢得了拍卖！作品已归入您的藏品库。`,
        timestamp: Date.now(),
        read: false
      };
      await addNotification(winNotif);
    }

    seller.balance += auction.currentPrice;
    const sellTx: Transaction = {
      id: uuidv4(),
      type: 'auction_sell',
      userId: seller.id,
      userName: seller.name,
      artworkId: auction.artworkId,
      auctionId: auction.id,
      amount: auction.currentPrice,
      timestamp: Date.now()
    };
    await addTransaction(sellTx);
  }

  await updateUser(seller);

  const sellNotif: Notification = {
    id: uuidv4(),
    userId: seller.id,
    title: auction.highestBidderId ? '💰 作品已售出!' : '⏰ 拍卖结束',
    message: auction.highestBidderId
      ? `您的作品以 ¥${auction.currentPrice} 成功售出！款项已到账。`
      : '您的拍卖已结束，暂无买家。',
    timestamp: Date.now(),
    read: false
  };
  await addNotification(sellNotif);
}
