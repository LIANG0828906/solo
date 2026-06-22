import { v4 as uuidv4 } from 'uuid';

export interface CardData {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
}

export interface ConnectionData {
  id: string;
  fromCardId: string;
  toCardId: string;
  label: string;
  color: string;
}

export interface SnapshotData {
  id: string;
  timestamp: number;
  cards: CardData[];
  connections: ConnectionData[];
}

export interface BoardState {
  cards: CardData[];
  connections: ConnectionData[];
}

const COLORS = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5'];
const AVATARS = ['🧑‍💻', '👩‍🎨', '🧑‍🔧', '👩‍💼', '🧑‍🔬', '👩‍🏫', '🧑‍🎨', '👩‍💻'];
const NAMES = ['小明', '小红', '小华', '小丽', '小强', '小美', '小刚', '小芳'];

class BoardManager {
  private cards: Map<string, CardData> = new Map();
  private connections: Map<string, ConnectionData> = new Map();
  private snapshots: SnapshotData[] = [];
  private sseClients: Set<{ id: string; res: any }> = new Set();
  private pendingUpdates: any[] = [];
  private incrementalTimer: NodeJS.Timeout | null = null;
  private fullSyncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startIncrementalPush();
    this.startFullSync();
  }

  private startIncrementalPush() {
    this.incrementalTimer = setInterval(() => {
      if (this.pendingUpdates.length > 0) {
        const updates = [...this.pendingUpdates];
        this.pendingUpdates = [];
        this.broadcast({ type: 'incremental', updates });
      }
    }, 100);
  }

  private startFullSync() {
    this.fullSyncTimer = setInterval(() => {
      this.broadcast({ type: 'full-sync', state: this.getBoardState() });
    }, 5000);
  }

  addSSEClient(res: any): string {
    const id = uuidv4();
    this.sseClients.add({ id, res });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const state = this.getBoardState();
    res.write(`data: ${JSON.stringify({ type: 'full-sync', state })}\n\n`);

    return id;
  }

  removeSSEClient(id: string) {
    for (const client of this.sseClients) {
      if (client.id === id) {
        this.sseClients.delete(client);
        break;
      }
    }
  }

  getOnlineCount(): number {
    return this.sseClients.size;
  }

  private broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.res.write(message);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  private pushUpdate(update: any) {
    this.pendingUpdates.push(update);
  }

  getBoardState(): BoardState {
    return {
      cards: Array.from(this.cards.values()),
      connections: Array.from(this.connections.values()),
    };
  }

  addCard(card: Partial<CardData>): CardData {
    const newCard: CardData = {
      id: uuidv4(),
      x: card.x ?? 100,
      y: card.y ?? 100,
      content: card.content ?? '',
      color: card.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      authorId: card.authorId ?? uuidv4(),
      authorName: card.authorName ?? NAMES[Math.floor(Math.random() * NAMES.length)],
      authorAvatar: card.authorAvatar ?? AVATARS[Math.floor(Math.random() * AVATARS.length)],
    };
    this.cards.set(newCard.id, newCard);
    this.pushUpdate({ action: 'add-card', card: newCard });
    return newCard;
  }

  updateCard(id: string, updates: Partial<CardData>): CardData | null {
    const card = this.cards.get(id);
    if (!card) return null;
    const updated = { ...card, ...updates };
    this.cards.set(id, updated);
    this.pushUpdate({ action: 'update-card', card: updated });
    return updated;
  }

  deleteCard(id: string): boolean {
    const deleted = this.cards.delete(id);
    if (deleted) {
      const connIds: string[] = [];
      for (const [connId, conn] of this.connections) {
        if (conn.fromCardId === id || conn.toCardId === id) {
          connIds.push(connId);
        }
      }
      for (const connId of connIds) {
        this.connections.delete(connId);
      }
      this.pushUpdate({ action: 'delete-card', cardId: id, connectionIds: connIds });
    }
    return deleted;
  }

  addConnection(conn: Partial<ConnectionData>): ConnectionData | null {
    if (!conn.fromCardId || !conn.toCardId) return null;
    const fromCard = this.cards.get(conn.fromCardId);
    if (!fromCard) return null;
    const newConn: ConnectionData = {
      id: uuidv4(),
      fromCardId: conn.fromCardId,
      toCardId: conn.toCardId,
      label: conn.label ?? '',
      color: conn.color ?? fromCard.color,
    };
    this.connections.set(newConn.id, newConn);
    this.pushUpdate({ action: 'add-connection', connection: newConn });
    return newConn;
  }

  deleteConnection(id: string): boolean {
    const deleted = this.connections.delete(id);
    if (deleted) {
      this.pushUpdate({ action: 'delete-connection', connectionId: id });
    }
    return deleted;
  }

  saveSnapshot(): SnapshotData {
    const snapshot: SnapshotData = {
      id: uuidv4(),
      timestamp: Date.now(),
      cards: Array.from(this.cards.values()),
      connections: Array.from(this.connections.values()),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  getSnapshots(): SnapshotData[] {
    return this.snapshots;
  }

  loadSnapshot(id: string): boolean {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) return false;
    this.cards.clear();
    this.connections.clear();
    for (const card of snapshot.cards) {
      this.cards.set(card.id, card);
    }
    for (const conn of snapshot.connections) {
      this.connections.set(conn.id, conn);
    }
    this.pushUpdate({ action: 'full-sync', state: this.getBoardState() });
    return true;
  }
}

export const boardManager = new BoardManager();
