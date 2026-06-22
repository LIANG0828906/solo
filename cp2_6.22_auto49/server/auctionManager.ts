import { v4 as uuidv4 } from 'uuid';
import type { Auction, BidRecord, User } from '../src/types';

const auctions: Map<string, Auction> = new Map();
const users: Map<string, User> = new Map();
const timers: Map<string, NodeJS.Timeout> = new Map();

function initMockUsers(): void {
  const mockUsers: User[] = [
    {
      id: 'user-1',
      username: 'booklover',
      nickname: '书虫小明',
      creditScore: 95,
      balance: 500,
    },
    {
      id: 'user-2',
      username: 'reader88',
      nickname: '阅读达人',
      creditScore: 88,
      balance: 320,
    },
    {
      id: 'user-3',
      username: 'collector',
      nickname: '藏书家老王',
      creditScore: 99,
      balance: 1200,
    },
  ];
  mockUsers.forEach((u) => users.set(u.id, u));
}

function initMockAuctions(): void {
  const now = Date.now();
  const mockAuctions: Auction[] = [
    {
      id: uuidv4(),
      sellerId: 'user-2',
      sellerNickname: '阅读达人',
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      description: '经典魔幻现实主义小说，书页完整无缺，九成新，收藏佳品。',
      coverUrl: 'https://picsum.photos/seed/book1/400/600',
      startPrice: 20,
      currentPrice: 20,
      durationHours: 24,
      startTime: now,
      endTime: now + 24 * 60 * 60 * 1000,
      status: 'active',
      bidHistory: [],
    },
    {
      id: uuidv4(),
      sellerId: 'user-3',
      sellerNickname: '藏书家老王',
      title: '三体',
      author: '刘慈欣',
      description: '雨果奖获奖作品，科幻迷必读。封面略有磨损，内页完好。',
      coverUrl: 'https://picsum.photos/seed/book2/400/600',
      startPrice: 35,
      currentPrice: 42,
      durationHours: 12,
      startTime: now - 2 * 60 * 60 * 1000,
      endTime: now + 10 * 60 * 60 * 1000,
      status: 'active',
      bidHistory: [
        {
          id: uuidv4(),
          auctionId: '',
          userId: 'user-1',
          nickname: '书虫小明',
          amount: 38,
          timestamp: now - 90 * 60 * 1000,
        },
        {
          id: uuidv4(),
          auctionId: '',
          userId: 'user-2',
          nickname: '阅读达人',
          amount: 42,
          timestamp: now - 30 * 60 * 1000,
        },
      ],
    },
    {
      id: uuidv4(),
      sellerId: 'user-1',
      sellerNickname: '书虫小明',
      title: '活着',
      author: '余华',
      description: '余华代表作，讲述一个人的一生。品相完好，无笔记划痕。',
      coverUrl: 'https://picsum.photos/seed/book3/400/600',
      startPrice: 15,
      currentPrice: 15,
      durationHours: 48,
      startTime: now + 2 * 60 * 60 * 1000,
      endTime: now + 50 * 60 * 60 * 1000,
      status: 'upcoming',
      bidHistory: [],
    },
    {
      id: uuidv4(),
      sellerId: 'user-3',
      sellerNickname: '藏书家老王',
      title: '红楼梦',
      author: '曹雪芹',
      description: '古典名著珍藏版，精装函套，值得收藏。',
      coverUrl: 'https://picsum.photos/seed/book4/400/600',
      startPrice: 80,
      currentPrice: 95,
      durationHours: 72,
      startTime: now - 6 * 60 * 60 * 1000,
      endTime: now + 66 * 60 * 60 * 1000,
      status: 'active',
      bidHistory: [
        {
          id: uuidv4(),
          auctionId: '',
          userId: 'user-2',
          nickname: '阅读达人',
          amount: 85,
          timestamp: now - 4 * 60 * 60 * 1000,
        },
        {
          id: uuidv4(),
          auctionId: '',
          userId: 'user-1',
          nickname: '书虫小明',
          amount: 90,
          timestamp: now - 2 * 60 * 60 * 1000,
        },
        {
          id: uuidv4(),
          auctionId: '',
          userId: 'user-2',
          nickname: '阅读达人',
          amount: 95,
          timestamp: now - 60 * 60 * 1000,
        },
      ],
    },
    {
      id: uuidv4(),
      sellerId: 'user-2',
      sellerNickname: '阅读达人',
      title: '小王子',
      author: '安托万·德·圣-埃克苏佩里',
      description: '中英文对照版，适合各年龄段阅读，全新。',
      coverUrl: 'https://picsum.photos/seed/book5/400/600',
      startPrice: 10,
      currentPrice: 10,
      durationHours: 6,
      startTime: now - 5 * 60 * 60 * 1000,
      endTime: now + 60 * 60 * 1000,
      status: 'active',
      bidHistory: [],
    },
    {
      id: uuidv4(),
      sellerId: 'user-1',
      sellerNickname: '书虫小明',
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      description: '从认知革命、农业革命到科学革命，重新审视人类历史。',
      coverUrl: 'https://picsum.photos/seed/book6/400/600',
      startPrice: 25,
      currentPrice: 25,
      durationHours: 36,
      startTime: now + 24 * 60 * 60 * 1000,
      endTime: now + 60 * 60 * 60 * 1000,
      status: 'upcoming',
      bidHistory: [],
    },
  ];

  mockAuctions.forEach((auction) => {
    auction.bidHistory.forEach((bid) => {
      bid.auctionId = auction.id;
    });
    auctions.set(auction.id, auction);
    if (auction.status === 'active') {
      scheduleAuctionEnd(auction.id);
    }
  });
}

initMockUsers();
initMockAuctions();

let eventEmitter: ((event: string, data: unknown) => void) | null = null;

export function setEventEmitter(emitter: (event: string, data: unknown) => void): void {
  eventEmitter = emitter;
}

function emitEvent(event: string, data: unknown): void {
  if (eventEmitter) {
    eventEmitter(event, data);
  }
}

export function getUser(id: string): User | undefined {
  return users.get(id);
}

export function getAllUsers(): User[] {
  return Array.from(users.values());
}

export function getAuctions(): Auction[] {
  return Array.from(auctions.values());
}

export function getAuctionById(id: string): Auction | undefined {
  return auctions.get(id);
}

export function createAuction(data: {
  sellerId: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  startPrice: number;
  durationHours: number;
}): Auction | { error: string } {
  const seller = users.get(data.sellerId);
  if (!seller) {
    return { error: '用户不存在' };
  }
  if (data.durationHours < 1 || data.durationHours > 72) {
    return { error: '拍卖时长需在1-72小时之间' };
  }
  if (!Number.isInteger(data.startPrice) || data.startPrice <= 0) {
    return { error: '起拍价必须是正整数' };
  }

  const now = Date.now();
  const id = uuidv4();
  const auction: Auction = {
    id,
    sellerId: data.sellerId,
    sellerNickname: seller.nickname,
    title: data.title,
    author: data.author,
    description: data.description,
    coverUrl: data.coverUrl,
    startPrice: data.startPrice,
    currentPrice: data.startPrice,
    durationHours: data.durationHours,
    startTime: now,
    endTime: now + data.durationHours * 60 * 60 * 1000,
    status: 'active',
    bidHistory: [],
  };

  auctions.set(id, auction);
  scheduleAuctionEnd(id);
  emitEvent('auction:created', auction);
  emitEvent('auctions:updated', getAuctions());
  return auction;
}

export function placeBid(auctionId: string, userId: string, amount: number): {
  success: boolean;
  auction?: Auction;
  error?: string;
} {
  const auction = auctions.get(auctionId);
  const user = users.get(userId);

  if (!auction) {
    return { success: false, error: '拍卖不存在' };
  }
  if (auction.status !== 'active') {
    return { success: false, error: '拍卖未在进行中' };
  }
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, error: '出价必须是正整数' };
  }
  if (amount < auction.currentPrice + 1) {
    return { success: false, error: `出价必须至少为 ¥${auction.currentPrice + 1}` };
  }
  if (user.balance < amount) {
    return { success: false, error: '余额不足' };
  }
  if (auction.sellerId === userId) {
    return { success: false, error: '不能对自己的商品出价' };
  }

  const remainingMs = auction.endTime - Date.now();
  if (remainingMs < 5 * 60 * 1000) {
    auction.endTime = Date.now() + 5 * 60 * 1000;
    rescheduleAuctionEnd(auctionId);
  }

  const bid: BidRecord = {
    id: uuidv4(),
    auctionId,
    userId,
    nickname: user.nickname,
    amount,
    timestamp: Date.now(),
  };

  auction.currentPrice = amount;
  auction.bidHistory.push(bid);
  auctions.set(auctionId, auction);

  emitEvent('auction:bid', { auction, bid });
  emitEvent(`auction:${auctionId}:updated`, auction);
  emitEvent('auctions:updated', getAuctions());

  return { success: true, auction };
}

function scheduleAuctionEnd(auctionId: string): void {
  const auction = auctions.get(auctionId);
  if (!auction) return;

  const delay = Math.max(0, auction.endTime - Date.now());
  const timer = setTimeout(() => endAuction(auctionId), delay);
  timers.set(auctionId, timer);
}

function rescheduleAuctionEnd(auctionId: string): void {
  const existingTimer = timers.get(auctionId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  scheduleAuctionEnd(auctionId);
}

export function endAuction(auctionId: string): void {
  const auction = auctions.get(auctionId);
  if (!auction || auction.status === 'ended') return;

  auction.status = 'ended';
  auction.endTime = Date.now();

  if (auction.bidHistory.length > 0) {
    const highestBid = auction.bidHistory[auction.bidHistory.length - 1];
    auction.winnerId = highestBid.userId;
    auction.winnerNickname = highestBid.nickname;
    auction.finalPrice = highestBid.amount;

    const seller = users.get(auction.sellerId);
    const winner = users.get(highestBid.userId);
    if (seller) {
      seller.balance += highestBid.amount;
    }
    if (winner) {
      winner.balance -= highestBid.amount;
    }
  }

  auctions.set(auctionId, auction);
  const timer = timers.get(auctionId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(auctionId);
  }

  emitEvent('auction:ended', auction);
  emitEvent(`auction:${auctionId}:ended`, auction);
  emitEvent('auctions:updated', getAuctions());
}

export function getUserAuctions(userId: string): Auction[] {
  return getAuctions().filter((a) => a.sellerId === userId);
}

export function getUserBids(userId: string): BidRecord[] {
  const allBids: BidRecord[] = [];
  auctions.forEach((auction) => {
    auction.bidHistory.forEach((bid) => {
      if (bid.userId === userId) {
        allBids.push(bid);
      }
    });
  });
  return allBids.sort((a, b) => b.timestamp - a.timestamp);
}
