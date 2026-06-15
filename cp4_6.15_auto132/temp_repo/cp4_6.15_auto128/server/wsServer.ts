import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import * as dataStore from '../src/utils/dataStore';
import {
  toPublicCardData,
  getAllPublicCards,
  getClientIpFromWs,
} from './utils';
import type {
  WSMessage,
  WSMessageType,
  CardCreatedPayload,
  RatingUpdatedPayload,
  CommentAddedPayload,
  InitSyncPayload,
  PublicCardData,
} from '../src/types';

interface ClientInfo {
  ws: WebSocket;
  ip: string;
}

let wss: WebSocketServer | null = null;
const clients: Set<ClientInfo> = new Set();

let pendingBroadcasts: Map<WSMessageType, { payload: unknown; timestamp: number }[]> = new Map();
let broadcastScheduled = false;
const BROADCAST_THROTTLE_MS = 40;

export function initWSServer(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    type WsWithReq = WebSocket & {
      upgradeReq?: {
        headers: Record<string, string | string[] | undefined>;
        socket?: { remoteAddress?: string };
      };
      _socket?: { remoteAddress?: string };
    };
    const clientInfo: ClientInfo = {
      ws,
      ip: getClientIpFromWs(ws as unknown as WsWithReq),
    };
    clients.add(clientInfo);

    sendInitSync(clientInfo);

    ws.on('close', () => {
      clients.delete(clientInfo);
    });

    ws.on('error', () => {
      clients.delete(clientInfo);
    });
  });
}

export function getClientCount(): number {
  return clients.size;
}

function sendInitSync(client: ClientInfo): void {
  if (client.ws.readyState !== WebSocket.OPEN) return;

  const allCards = dataStore.getAllCards();
  const publicCards = getAllPublicCards(allCards, client.ip);

  const message: WSMessage = {
    type: 'INIT_SYNC',
    payload: { cards: publicCards } satisfies InitSyncPayload,
    timestamp: Date.now(),
  };

  client.ws.send(JSON.stringify(message));
}

export function broadcastCardCreated(card: PublicCardData): void {
  queueBroadcast('CARD_CREATED', { card } satisfies CardCreatedPayload);
}

export function broadcastRatingUpdated(
  cardId: string,
  averageRating: number,
  ratingCount: number
): void {
  queueBroadcast('RATING_UPDATED', {
    cardId,
    averageRating,
    ratingCount,
  } satisfies RatingUpdatedPayload);
}

export function broadcastCommentAdded(
  cardId: string,
  comment: CommentAddedPayload['comment'],
  commentCount: number
): void {
  queueBroadcast('COMMENT_ADDED', {
    cardId,
    comment,
    commentCount,
  } satisfies CommentAddedPayload);
}

function queueBroadcast(type: WSMessageType, payload: unknown): void {
  const timestamp = Date.now();
  if (!pendingBroadcasts.has(type)) {
    pendingBroadcasts.set(type, []);
  }
  pendingBroadcasts.get(type)!.push({ payload, timestamp });

  if (!broadcastScheduled) {
    broadcastScheduled = true;
    setTimeout(processPendingBroadcasts, BROADCAST_THROTTLE_MS);
  }
}

function processPendingBroadcasts(): void {
  const batches: WSMessage[] = [];

  pendingBroadcasts.forEach((entries, type) => {
    if (entries.length === 0) return;

    switch (type) {
      case 'CARD_CREATED': {
        entries.forEach((entry) => {
          batches.push({
            type,
            payload: (entry.payload as CardCreatedPayload).card,
            timestamp: entry.timestamp,
          });
        });
        break;
      }
      case 'RATING_UPDATED': {
        const latestByCard = new Map<string, RatingUpdatedPayload & { timestamp: number }>();
        entries.forEach((entry) => {
          const p = entry.payload as RatingUpdatedPayload;
          const existing = latestByCard.get(p.cardId);
          if (!existing || entry.timestamp > existing.timestamp) {
            latestByCard.set(p.cardId, { ...p, timestamp: entry.timestamp });
          }
        });
        latestByCard.forEach((value) => {
          batches.push({
            type,
            payload: {
              cardId: value.cardId,
              averageRating: value.averageRating,
              ratingCount: value.ratingCount,
            } satisfies RatingUpdatedPayload,
            timestamp: value.timestamp,
          });
        });
        break;
      }
      case 'COMMENT_ADDED': {
        entries.forEach((entry) => {
          batches.push({
            type,
            payload: entry.payload,
            timestamp: entry.timestamp,
          });
        });
        break;
      }
    }
  });

  pendingBroadcasts.clear();
  broadcastScheduled = false;

  if (batches.length === 0) return;

  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    try {
      if (batches.length === 1) {
        client.ws.send(JSON.stringify(batches[0]));
      } else {
        batches.forEach((msg) => {
          client.ws.send(JSON.stringify(msg));
        });
      }
    } catch {
    }
  });
}

export { toPublicCardData, getAllPublicCards };
