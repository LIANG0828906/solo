import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User, Auction, AuctionItem, Bid } from '../types';

interface AuctionState {
  auctions: Auction[];
  currentAuction: Auction | null;
  currentItem: AuctionItem | null;
  userBids: Bid[];
  favorites: string[];
  currentUser: User;
  fetchAuctions: () => Auction[];
  fetchAuctionDetail: (auctionId: string) => Auction | null;
  fetchItemDetail: (auctionId: string, itemId: string) => AuctionItem | null;
  placeBid: (auctionId: string, itemId: string, amount: number) => boolean;
  toggleFavorite: (itemId: string) => void;
}

const generateUser = (id: string, name: string): User => ({
  id,
  name,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
});

const generateBid = (user: User, amount: number, hoursAgo: number): Bid => ({
  id: uuidv4(),
  userId: user.id,
  userName: user.name,
  userAvatar: user.avatar,
  amount,
  time: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
});

const mockUsers: User[] = [
  generateUser('user-1', '张小明'),
  generateUser('user-2', '李华'),
  generateUser('user-3', '王芳'),
  generateUser('user-4', '赵强'),
  generateUser('user-5', '陈静'),
  generateUser('user-6', '刘洋'),
];

const currentUser: User = generateUser('current-user', '我是买家');

const generateAuctionItems = (auctionId: string, count: number, startIndex: number): AuctionItem[] => {
  const itemNames = [
    '清代青花瓷瓶',
    '名家书法作品',
    '稀有邮票合集',
    '古董钟表',
    '和田玉挂件',
    '红木家具',
    '古钱币收藏',
    '紫砂壶',
    '翡翠手镯',
    '古籍善本',
    '油画真迹',
    '青铜器',
    '唐三彩',
    '宋代汝窑',
    '明式家具',
    '田黄石印章',
    '琥珀蜜蜡',
    '珍珠项链',
    '钻石戒指',
    '黄金摆件',
    '紫檀木雕',
    '象牙雕刻',
    '缂丝工艺品',
    '景泰蓝花瓶',
  ];

  const itemDescriptions = [
    '保存完好，品相极佳，具有很高的收藏价值。',
    '年代久远，工艺精湛，是收藏爱好者的不二之选。',
    '此物为祖传之物，品质上乘，市场罕见。',
    '经过专业鉴定，保证真品，值得拥有。',
    '造型优美，线条流畅，艺术价值极高。',
    '选材考究，做工精细，彰显品位。',
  ];

  const items: AuctionItem[] = [];

  for (let i = 0; i < count; i++) {
    const itemIndex = (startIndex + i) % itemNames.length;
    const startingPrice = Math.floor(Math.random() * 50000) + 1000;
    const bidCount = Math.floor(Math.random() * 3) + 3;
    const bids: Bid[] = [];
    let currentPrice = startingPrice;

    for (let j = 0; j < bidCount; j++) {
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      currentPrice = Math.floor(currentPrice * (1 + Math.random() * 0.3));
      bids.push(generateBid(randomUser, currentPrice, (j + 1) * 2 + Math.random() * 5));
    }

    items.push({
      id: `item-${auctionId}-${i + 1}`,
      name: itemNames[itemIndex],
      description: itemDescriptions[Math.floor(Math.random() * itemDescriptions.length)],
      image: `https://picsum.photos/seed/${auctionId}-${i + 1}/400/300`,
      startingPrice,
      currentPrice,
      bidCount,
      bids,
      auctionId,
    });
  }

  return items;
};

const generateMockAuctions = (): Auction[] => {
  const auctionData = [
    {
      id: 'auction-1',
      name: '春季古董艺术品拍卖会',
      description: '本场拍卖会汇集了众多珍稀古董艺术品，涵盖瓷器、玉器、书画等多个品类，诚邀各位藏家莅临品鉴。',
      itemCount: 6,
      daysUntilEnd: 3,
      status: 'ongoing' as const,
    },
    {
      id: 'auction-2',
      name: '珠宝玉石精品专场',
      description: '精选上等珠宝玉石，品质保证，价格优惠，是您收藏和送礼的最佳选择。',
      itemCount: 7,
      daysUntilEnd: 7,
      status: 'upcoming' as const,
    },
    {
      id: 'auction-3',
      name: '古籍善本名人字画专场',
      description: '本场拍卖会展出大量珍贵古籍善本和名人字画，具有极高的历史价值和艺术价值。',
      itemCount: 5,
      daysUntilEnd: -2,
      status: 'ended' as const,
    },
  ];

  return auctionData.map((data, index) => {
    const items = generateAuctionItems(data.id, data.itemCount, index * 8);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      itemCount: data.itemCount,
      endTime: new Date(Date.now() + data.daysUntilEnd * 24 * 60 * 60 * 1000),
      items,
      status: data.status,
    };
  });
};

const mockAuctions = generateMockAuctions();

export const useAuctionStore = create<AuctionState>((set, get) => ({
  auctions: mockAuctions,
  currentAuction: null,
  currentItem: null,
  userBids: [],
  favorites: [],
  currentUser,

  fetchAuctions: () => {
    const { auctions } = get();
    return auctions;
  },

  fetchAuctionDetail: (auctionId: string) => {
    const { auctions } = get();
    const auction = auctions.find((a) => a.id === auctionId) || null;
    set({ currentAuction: auction });
    return auction;
  },

  fetchItemDetail: (auctionId: string, itemId: string) => {
    const { auctions } = get();
    const auction = auctions.find((a) => a.id === auctionId);
    const item = auction?.items.find((i) => i.id === itemId) || null;
    set({ currentItem: item, currentAuction: auction || null });
    return item;
  },

  placeBid: (auctionId: string, itemId: string, amount: number) => {
    const { auctions, currentUser, userBids } = get();
    const auctionIndex = auctions.findIndex((a) => a.id === auctionId);
    if (auctionIndex === -1) return false;

    const auction = auctions[auctionIndex];
    const itemIndex = auction.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = auction.items[itemIndex];
    if (amount <= item.currentPrice) return false;

    const newBid: Bid = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      amount,
      time: new Date(),
    };

    const updatedItems = [...auction.items];
    updatedItems[itemIndex] = {
      ...item,
      currentPrice: amount,
      bidCount: item.bidCount + 1,
      bids: [...item.bids, newBid],
    };

    const updatedAuctions = [...auctions];
    updatedAuctions[auctionIndex] = {
      ...auction,
      items: updatedItems,
    };

    set({
      auctions: updatedAuctions,
      currentAuction: updatedAuctions[auctionIndex],
      currentItem: updatedItems[itemIndex],
      userBids: [...userBids, newBid],
    });

    return true;
  },

  toggleFavorite: (itemId: string) => {
    const { favorites } = get();
    if (favorites.includes(itemId)) {
      set({ favorites: favorites.filter((id) => id !== itemId) });
    } else {
      set({ favorites: [...favorites, itemId] });
    }
  },
}));
