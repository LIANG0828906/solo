import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startPrice: number;
  currentHighestBid: number;
  currentHighestBidder: string | null;
  buyNowPrice: number;
  sellerName: string;
  sellerId: string;
  color: string;
  startTime: number;
  endTime: number;
  status: string;
  soldPrice?: number;
  soldTo?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  bidderId: string;
  amount: number;
  time: number;
}

export interface Negotiation {
  id: string;
  auctionId: string;
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  time: number;
}

export interface Notification {
  id: string;
  type: 'sold' | 'negotiation' | 'bid-error';
  message: string;
  color: string;
  duration?: number;
}

interface AuctionState {
  socket: Socket | null;
  nickname: string;
  loggedIn: boolean;
  auctions: Auction[];
  selectedAuction: Auction | null;
  bids: Bid[];
  negotiations: Negotiation[];
  notifications: Notification[];
  currentPage: 'list' | 'detail';
  searchQuery: string;
  connectSocket: (nickname: string) => void;
  disconnectSocket: () => void;
  login: (nickname: string) => void;
  logout: () => void;
  fetchAuctions: () => Promise<void>;
  selectAuction: (id: string) => Promise<void>;
  placeBid: (auctionId: string, amount: number) => void;
  sendNegotiation: (auctionId: string, amount: number, message: string) => void;
  acceptNegotiation: (auctionId: string, negId: string) => void;
  rejectNegotiation: (auctionId: string, negId: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setPage: (page: 'list' | 'detail') => void;
  setSearchQuery: (query: string) => void;
}

let notifCounter = 0;

export const useAuctionStore = create<AuctionState>((set, get) => ({
  socket: null,
  nickname: '',
  loggedIn: false,
  auctions: [],
  selectedAuction: null,
  bids: [],
  negotiations: [],
  notifications: [],
  currentPage: 'list',
  searchQuery: '',

  connectSocket: (nickname: string) => {
    const socket = io({
      query: { nickname },
      transports: ['websocket', 'polling'],
    });

    socket.on('auction-updated', (auction: Auction) => {
      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auction.id ? auction : a
        ),
        selectedAuction:
          state.selectedAuction?.id === auction.id
            ? auction
            : state.selectedAuction,
      }));
    });

    socket.on('new-bid', ({ bid, auction }: { bid: Bid; auction: Auction }) => {
      set((state) => {
        const isNew = !state.bids.find((b) => b.id === bid.id);
        return {
          bids: isNew ? [...state.bids, bid] : state.bids,
          selectedAuction:
            state.selectedAuction?.id === auction.id
              ? auction
              : state.selectedAuction,
        };
      });
    });

    socket.on('auction-sold', ({ auctionId, title, amount, buyer }: any) => {
      get().addNotification({
        type: 'sold',
        message: `《${title}》已以${amount}元成交！`,
        color: '#2E7D32',
        duration: 3000,
      });
    });

    socket.on('negotiation-notification', ({ auctionId, from, amount, negId }: any) => {
      const state = get();
      if (state.selectedAuction && state.selectedAuction.sellerName === state.nickname) {
        get().addNotification({
          type: 'negotiation',
          message: `${from}对《${state.selectedAuction.title}》出价${amount}元议价`,
          color: '#E65100',
          duration: 5000,
        });
        const origTitle = document.title;
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
          document.title = blinkCount % 2 === 0 ? '新议价' : origTitle;
          blinkCount++;
          if (blinkCount >= 10) {
            clearInterval(blinkInterval);
            document.title = origTitle;
          }
        }, 800);
      }
    });

    socket.on('new-negotiation', (neg: Negotiation) => {
      set((state) => {
        const isNew = !state.negotiations.find((n) => n.id === neg.id);
        return {
          negotiations: isNew
            ? [...state.negotiations, neg]
            : state.negotiations,
        };
      });
    });

    socket.on('negotiation-accepted', ({ auctionId, negId, amount, buyer }: any) => {
      set((state) => ({
        negotiations: state.negotiations.map((n) =>
          n.id === negId ? { ...n, status: 'accepted' as const } : n
        ),
      }));
    });

    socket.on('negotiation-rejected', ({ auctionId, negId }: any) => {
      set((state) => ({
        negotiations: state.negotiations.map((n) =>
          n.id === negId ? { ...n, status: 'rejected' as const } : n
        ),
      }));
    });

    socket.on('bid-error', ({ message }: any) => {
      get().addNotification({
        type: 'bid-error',
        message,
        color: '#C62828',
        duration: 3000,
      });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  login: (nickname: string) => {
    set({ nickname, loggedIn: true });
    get().connectSocket(nickname);
    get().fetchAuctions();
  },

  logout: () => {
    get().disconnectSocket();
    set({ nickname: '', loggedIn: false, auctions: [], selectedAuction: null, bids: [], negotiations: [] });
  },

  fetchAuctions: async () => {
    try {
      const res = await fetch('/api/auctions');
      const data = await res.json();
      set({ auctions: data });
    } catch (e) {
      console.error('Failed to fetch auctions', e);
    }
  },

  selectAuction: async (id: string) => {
    const { socket } = get();
    const prev = get().selectedAuction;
    if (prev && socket) {
      socket.emit('leave-auction', prev.id);
    }
    try {
      const res = await fetch(`/api/auctions/${id}`);
      const data = await res.json();
      set({
        selectedAuction: data.auction,
        bids: data.bids,
        negotiations: data.negotiations,
        currentPage: 'detail',
      });
      if (socket) {
        socket.emit('join-auction', id);
      }
    } catch (e) {
      console.error('Failed to fetch auction detail', e);
    }
  },

  placeBid: (auctionId: string, amount: number) => {
    const { socket, nickname } = get();
    if (socket) {
      socket.emit('place-bid', { auctionId, amount, bidder: nickname });
    }
  },

  sendNegotiation: (auctionId: string, amount: number, message: string) => {
    const { socket, nickname } = get();
    if (socket) {
      socket.emit('send-negotiation', {
        auctionId,
        amount,
        message,
        from: nickname,
      });
    }
  },

  acceptNegotiation: (auctionId: string, negId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('accept-negotiation', { auctionId, negId });
    }
  },

  rejectNegotiation: (auctionId: string, negId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('reject-negotiation', { auctionId, negId });
    }
  },

  addNotification: (notification) => {
    const id = `notif-${++notifCounter}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    const duration = notification.duration || 3000;
    setTimeout(() => {
      get().removeNotification(id);
    }, duration);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  setPage: (page: 'list' | 'detail') => {
    set({ currentPage: page });
    if (page === 'list') {
      set({ selectedAuction: null, bids: [], negotiations: [] });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));
