import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Artwork, Bid, User } from '../types';

interface StoreState {
  artworks: Artwork[];
  selectedArtworkId: string | null;
  bids: Bid[];
  currentUser: User;
  placeBid: (artworkId: string, amount: number) => boolean;
  selectArtwork: (id: string | null) => void;
  loadArtworks: (artworks: Artwork[]) => void;
  getBidsForArtwork: (artworkId: string) => Bid[];
  getSelectedArtwork: () => Artwork | null;
  setArtworkEnded: (artworkId: string) => void;
}

const sampleArtworks: Artwork[] = [
  {
    id: '1',
    title: '手工陶瓷茶杯套装',
    artist: '青瓷匠人',
    description: '采用传统青瓷工艺，手工拉坯成型，经1280度高温烧制。釉色温润如玉，手感细腻。一套含两杯，适合日常品茗或送礼。',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    startingPrice: 280,
    currentPrice: 280,
    endTime: Date.now() + 5 * 60 * 1000,
    isEnded: false
  },
  {
    id: '2',
    title: '手织羊毛围巾',
    artist: '织梦者',
    description: '100%澳洲美利奴羊毛，手工编织，柔软保暖。采用经典鱼骨纹图案，搭配流苏设计，秋冬必备单品。',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
    startingPrice: 350,
    currentPrice: 420,
    endTime: Date.now() + 4 * 60 * 1000,
    isEnded: false
  },
  {
    id: '3',
    title: '原木雕刻摆件',
    artist: '木语工坊',
    description: '精选百年老榆木，纯手工雕刻。造型为山水意境，纹理自然，每一件都是独一无二的艺术品。',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    startingPrice: 580,
    currentPrice: 720,
    endTime: Date.now() + 3 * 60 * 1000,
    isEnded: false
  },
  {
    id: '4',
    title: '牛皮手工钱包',
    artist: '皮艺小铺',
    description: '头层牛皮，手工缝制，复古铜扣。内设多个卡位和钞位，实用与美观兼具，越用越有韵味。',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
    startingPrice: 320,
    currentPrice: 320,
    endTime: Date.now() + 6 * 60 * 1000,
    isEnded: false
  },
  {
    id: '5',
    title: '竹编收纳篮',
    artist: '竹影轩',
    description: '采用浙江安吉毛竹，手工编织而成。纹理细密，造型雅致，可用于收纳水果、杂物等。',
    imageUrl: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=800&q=80',
    startingPrice: 150,
    currentPrice: 180,
    endTime: Date.now() + 2 * 60 * 1000,
    isEnded: false
  },
  {
    id: '6',
    title: '手绘团扇',
    artist: '墨韵斋',
    description: '真丝扇面，手绘工笔花鸟图案。竹制扇柄，轻盈雅致。夏日纳凉或做装饰都别具韵味。',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    startingPrice: 200,
    currentPrice: 260,
    endTime: Date.now() + 5 * 60 * 1000,
    isEnded: false
  }
];

const initialBids: Bid[] = [
  {
    id: uuidv4(),
    artworkId: '2',
    userId: 'user2',
    userNickname: '收藏家小王',
    amount: 420,
    timestamp: Date.now() - 60000
  },
  {
    id: uuidv4(),
    artworkId: '3',
    userId: 'user3',
    userNickname: '艺术爱好者',
    amount: 720,
    timestamp: Date.now() - 120000
  },
  {
    id: uuidv4(),
    artworkId: '3',
    userId: 'user4',
    userNickname: '木头控',
    amount: 650,
    timestamp: Date.now() - 300000
  },
  {
    id: uuidv4(),
    artworkId: '5',
    userId: 'user5',
    userNickname: '竹韵',
    amount: 180,
    timestamp: Date.now() - 180000
  },
  {
    id: uuidv4(),
    artworkId: '6',
    userId: 'user6',
    userNickname: '扇子控',
    amount: 260,
    timestamp: Date.now() - 90000
  }
];

const currentUser: User = {
  id: 'user1',
  nickname: '买家小李'
};

export const useStore = create<StoreState>((set, get) => ({
  artworks: sampleArtworks,
  selectedArtworkId: null,
  bids: initialBids,
  currentUser,

  placeBid: (artworkId: string, amount: number): boolean => {
    const state = get();
    const artwork = state.artworks.find(a => a.id === artworkId);
    const user = state.currentUser;

    if (!artwork || artwork.isEnded) return false;

    const minBid = Math.ceil(artwork.currentPrice * 1.1);
    if (amount < minBid) return false;
    if (!Number.isInteger(amount)) return false;

    const newBid: Bid = {
      id: uuidv4(),
      artworkId,
      userId: user.id,
      userNickname: user.nickname,
      amount,
      timestamp: Date.now()
    };

    set(state => ({
      artworks: state.artworks.map(a =>
        a.id === artworkId
          ? {
              ...a,
              currentPrice: amount,
              endTime: Date.now() + 15 * 1000
            }
          : a
      ),
      bids: [...state.bids, newBid]
    }));

    return true;
  },

  selectArtwork: (id: string | null) => {
    set({ selectedArtworkId: id });
  },

  loadArtworks: (artworks: Artwork[]) => {
    set({ artworks });
  },

  getBidsForArtwork: (artworkId: string): Bid[] => {
    return get().bids
      .filter(b => b.artworkId === artworkId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getSelectedArtwork: (): Artwork | null => {
    const state = get();
    return state.artworks.find(a => a.id === state.selectedArtworkId) || null;
  },

  setArtworkEnded: (artworkId: string) => {
    set(state => {
      const artwork = state.artworks.find(a => a.id === artworkId);
      if (!artwork || artwork.isEnded) return {};

      const bids = state.bids
        .filter(b => b.artworkId === artworkId)
        .sort((a, b) => b.amount - a.amount);

      const winner = bids[0];

      return {
        artworks: state.artworks.map(a =>
          a.id === artworkId
            ? {
                ...a,
                isEnded: true,
                winnerId: winner?.userId,
                winnerNickname: winner?.userNickname
              }
            : a
        )
      };
    });
  }
}));
