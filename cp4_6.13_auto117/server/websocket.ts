import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { WSMessage, WSMessageType } from '../src/types/index.js';
import {
  getAllTasks,
  updateTimeSpent,
  setTaskRunning,
  getTaskById,
} from './taskData.js';

interface ConnectedClient {
  ws: WebSocket;
  id: string;
}

let clients: ConnectedClient[] = [];
let wss: WebSocketServer | null = null;

function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function broadcast<T = unknown>(type: WSMessageType, payload: T): void {
  const message: WSMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };
  const raw = JSON.stringify(message);

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(raw);
    }
  }
}

function sendToClient<T = unknown>(client: ConnectedClient, type: WSMessageType, payload: T): void {
  const message: WSMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function handleIncomingMessage(client: ConnectedClient, raw: string): void {
  try {
    const parsed = JSON.parse(raw) as Partial<WSMessage>;
    if (!parsed.type || typeof parsed.type !== 'string') {
      sendToClient(client, 'ERROR', 'Invalid message format: missing type');
      return;
    }

    switch (parsed.type) {
      case 'TIME_SYNC': {
        const payload = parsed.payload as { taskId: string; timeSpent: number } | undefined;
        if (!payload || typeof payload.taskId !== 'string' || typeof payload.timeSpent !== 'number') {
          sendToClient(client, 'ERROR', 'Invalid TIME_SYNC payload');
          return;
        }
        const updated = updateTimeSpent(payload.taskId, payload.timeSpent);
        if (updated) {
          broadcast('TASK_UPDATED', updated);
        }
        break;
      }

      case 'TIMER_STARTED': {
        const payload = parsed.payload as { taskId: string; timestamp: number } | undefined;
        if (!payload || typeof payload.taskId !== 'string') {
          sendToClient(client, 'ERROR', 'Invalid TIMER_STARTED payload');
          return;
        }
        const updated = setTaskRunning(payload.taskId, true);
        if (updated) {
          broadcast('TIMER_STARTED', { taskId: payload.taskId, timestamp: payload.timestamp ?? Date.now() });
          broadcast('TASK_UPDATED', updated);
        }
        break;
      }

      case 'TIMER_PAUSED': {
        const payload = parsed.payload as { taskId: string; timeSpent: number } | undefined;
        if (!payload || typeof payload.taskId !== 'string') {
          sendToClient(client, 'ERROR', 'Invalid TIMER_PAUSED payload');
          return;
        }
        if (typeof payload.timeSpent === 'number') {
          updateTimeSpent(payload.taskId, payload.timeSpent);
        }
        const updated = setTaskRunning(payload.taskId, false);
        if (updated) {
          broadcast('TIMER_PAUSED', { taskId: payload.taskId, timeSpent: updated.timeSpent });
          broadcast('TASK_UPDATED', updated);
        }
        break;
      }

      case 'TIMER_RESET': {
        const payload = parsed.payload as { taskId: string } | undefined;
        if (!payload || typeof payload.taskId !== 'string') {
          sendToClient(client, 'ERROR', 'Invalid TIMER_RESET payload');
          return;
        }
        const task = getTaskById(payload.taskId);
        if (task) {
          updateTimeSpent(payload.taskId, 0);
          const updated = setTaskRunning(payload.taskId, false);
          if (updated) {
            broadcast('TIMER_RESET', { taskId: payload.taskId });
            broadcast('TASK_UPDATED', updated);
          }
        }
        break;
      }

      default:
        sendToClient(client, 'ERROR', `Unknown message type: ${parsed.type}`);
        break;
    }
  } catch {
    sendToClient(client, 'ERROR', 'Failed to parse message');
  }
}

export function setupWebSocket(server: HTTPServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const client: ConnectedClient = {
      ws,
      id: generateClientId(),
    };
    clients.push(client);

    const initialTasks = getAllTasks();
    sendToClient(client, 'SNAPSHOT', initialTasks);

    ws.on('message', (data) => {
      handleIncomingMessage(client, data.toString());
    });

    ws.on('close', () => {
      clients = clients.filter((c) => c.id !== client.id);
    });

    ws.on('error', () => {
      clients = clients.filter((c) => c.id !== client.id);
    });
  });

  return wss;
}

export function getWSS(): WebSocketServer | null {
  return wss;
}
