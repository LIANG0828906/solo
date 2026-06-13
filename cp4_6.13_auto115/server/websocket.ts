import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const subscriptions = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentSurveyId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe' && data.surveyId) {
          currentSurveyId = data.surveyId;
          if (!subscriptions.has(data.surveyId)) {
            subscriptions.set(data.surveyId, new Set());
          }
          subscriptions.get(data.surveyId)!.add(ws);
        } else if (data.type === 'unsubscribe' && data.surveyId) {
          const subs = subscriptions.get(data.surveyId);
          if (subs) {
            subs.delete(ws);
          }
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });

    ws.on('close', () => {
      if (currentSurveyId) {
        const subs = subscriptions.get(currentSurveyId);
        if (subs) {
          subs.delete(ws);
        }
      }
    });
  });
}

export function broadcastNewResponse(surveyId: string): void {
  const subs = subscriptions.get(surveyId);
  if (!subs) return;

  const message = JSON.stringify({ type: 'new_response' });
  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
