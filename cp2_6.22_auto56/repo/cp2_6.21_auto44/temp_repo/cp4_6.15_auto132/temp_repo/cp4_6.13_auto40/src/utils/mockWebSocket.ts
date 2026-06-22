import type {
  AuctionItem,
  BidRecord,
  RoomState,
  User,
  WSMessage,
  JoinRoomPayload,
  PlaceBidPayload,
  NewBidPayload,
  ItemChangedPayload,
  UploadItemPayload,
} from '../types';

const COUNTDOWN_SECONDS = 45;
const BID_INCREMENT = 10;

const mockItems: AuctionItem[] = [
  {
    id: 'item-1',
    name: '清代青花瓷瓶',
    startPrice: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
  },
  {
    id: 'item-2',
    name: '复古机械怀表',
    startPrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&h=400&fit=crop',
  },
  {
    id: 'item-3',
    name: '古铜色烛台一对',
    startPrice: 300,
    imageUrl: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=600&h=400&fit=crop',
  },
  {
    id: 'item-4',
    name: '羊皮精装古籍',
    startPrice: 800,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop',
  },
];

class MockRoom {
  roomId: string;
  state: RoomState;
  private clients: Set<MockWebSocket> = new Set();
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.state = {
      roomId,
      currentItem: null,
      itemQueue: [...mockItems],
      bidHistory: [],
      highestBid: 0,
      highestBidder: '',
      highestBidderNickname: '',
      countdown: COUNTDOWN_SECONDS,
      status: 'waiting',
      users: [],
    };
    this.nextItem();
  }

  addClient(client: MockWebSocket): void {
    this.clients.add(client);
  }

  removeClient(client: MockWebSocket): void {
    this.clients.delete(client);
    this.state.users = this.state.users.filter((u) => u.id !== client.userId);
    this.broadcastState();
  }

  joinRoom(user: User): void {
    if (!this.state.users.find((u) => u.id === user.id)) {
      this.state.users.push(user);
    }
    this.broadcastState();
  }

  placeBid(userId: string, amount: number): void {
    if (this.state.status !== 'bidding' || !this.state.currentItem) return;
    if (amount <= this.state.highestBid) return;

    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return;

    const bid: BidRecord = {
      id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      amount,
      timestamp: Date.now(),
    };

    this.state.bidHistory.push(bid);
    this.state.highestBid = amount;
    this.state.highestBidder = userId;
    this.state.highestBidderNickname = user.nickname;
    this.state.countdown = COUNTDOWN_SECONDS;

    const payload: NewBidPayload = {
      bid,
      countdown: this.state.countdown,
      highestBid: this.state.highestBid,
      highestBidder: this.state.highestBidder,
      highestBidderNickname: this.state.highestBidderNickname,
    };

    this.broadcast({ type: 'NEW_BID', payload });
    this.startCountdown();
  }

  uploadItem(item: AuctionItem): void {
    this.state.itemQueue.push(item);
    if (!this.state.currentItem) {
      this.nextItem();
    }
    this.broadcastState();
  }

  private nextItem(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    if (this.state.itemQueue.length === 0) {
      this.state.status = 'ended';
      this.broadcast({ type: 'AUCTION_ENDED', payload: null });
      return;
    }

    const nextItem = this.state.itemQueue.shift()!;
    this.state.currentItem = nextItem;
    this.state.bidHistory = [];
    this.state.highestBid = nextItem.startPrice;
    this.state.highestBidder = '';
    this.state.highestBidderNickname = '';
    this.state.countdown = COUNTDOWN_SECONDS;
    this.state.status = 'bidding';

    const payload: ItemChangedPayload = {
      item: nextItem,
      countdown: this.state.countdown,
      bidHistory: [],
    };

    this.broadcast({ type: 'ITEM_CHANGED', payload });
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    this.countdownTimer = setInterval(() => {
      this.state.countdown -= 1;
      this.broadcastState();

      if (this.state.countdown <= 0) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.state.status = 'ended';
        this.broadcast({ type: 'AUCTION_ENDED', payload: null });
        
        setTimeout(() => {
          this.nextItem();
        }, 3000);
      }
    }, 1000);
  }

  private broadcast(message: WSMessage): void {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.dispatchMessage(message);
      }
    });
  }

  private broadcastState(): void {
    this.broadcast({ type: 'ROOM_STATE', payload: this.state });
  }

  destroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.clients.clear();
  }
}

const rooms: Map<string, MockRoom> = new Map();

function getOrCreateRoom(roomId: string): MockRoom {
  let room = rooms.get(roomId);
  if (!room) {
    room = new MockRoom(roomId);
    rooms.set(roomId, room);
  }
  return room;
}

export class MockWebSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING;
  userId: string = '';
  private room: MockRoom | null = null;

  constructor(_url: string) {
    super();
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 100);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) return;

    const message = JSON.parse(data) as WSMessage;

    switch (message.type) {
      case 'JOIN_ROOM': {
        const payload = message.payload as JoinRoomPayload;
        this.userId = payload.user.id;
        this.room = getOrCreateRoom(payload.roomId);
        this.room.addClient(this);
        this.room.joinRoom(payload.user);
        break;
      }
      case 'PLACE_BID': {
        const payload = message.payload as PlaceBidPayload;
        if (this.room && this.userId) {
          this.room.placeBid(this.userId, payload.amount);
        }
        break;
      }
      case 'UPLOAD_ITEM': {
        const payload = message.payload as UploadItemPayload;
        if (this.room) {
          this.room.uploadItem(payload.item);
        }
        break;
      }
    }
  }

  close(): void {
    if (this.room) {
      this.room.removeClient(this);
    }
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }

  dispatchMessage(message: WSMessage): void {
    const event = new MessageEvent('message', {
      data: JSON.stringify(message),
    });
    this.dispatchEvent(event);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    super.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    super.removeEventListener(type, listener);
  }
}

export function createMockWebSocket(url: string): MockWebSocket {
  return new MockWebSocket(url);
}

export { BID_INCREMENT, COUNTDOWN_SECONDS };
