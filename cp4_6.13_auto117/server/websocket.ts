import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { WSMessage, WSMessageType, Task } from '../src/types';
import {
  getAllTasks,
  addTask,
  updateTask,
  deleteTask,
  updateTimeSpent,
  setTimerRunning,
  resetTimer,
} from './taskData';

type BroadcastFn = (msg: WSMessage) => void;

interface WSExt extends WebSocket {
  isAlive?: boolean;
}

function validateMessage(data: unknown): { type: WSMessageType; payload: unknown } | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.type !== 'string') return null;
  return { type: obj.type as WSMessageType, payload: obj.payload };
}

export function createWSServer(server: HTTPServer): { wss: WebSocketServer; broadcast: BroadcastFn } {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WSExt>();

  const broadcast = (msg: WSMessage): void => {
    const raw = JSON.stringify(msg);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  };

  const sendTo = (client: WSExt, type: WSMessageType, payload: unknown): void => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  };

  wss.on('connection', (ws: WSExt) => {
    ws.isAlive = true;
    clients.add(ws);
    sendTo(ws, 'SNAPSHOT', getAllTasks());

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        const msg = validateMessage(parsed);
        if (!msg) {
          sendTo(ws, 'ERROR', 'Invalid message format');
          return;
        }

        const now = Date.now();

        switch (msg.type) {
          case 'TASK_CREATED': {
            const input = msg.payload as Parameters<typeof addTask>[0];
            if (!input || typeof input.title !== 'string') {
              sendTo(ws, 'ERROR', 'Invalid task payload');
              return;
            }
            const task = addTask(input);
            broadcast({ type: 'TASK_CREATED', payload: task, timestamp: now });
            break;
          }
          case 'TASK_UPDATED': {
            const payload = msg.payload as { id: string; data: Parameters<typeof updateTask>[1] };
            if (!payload || !payload.id) {