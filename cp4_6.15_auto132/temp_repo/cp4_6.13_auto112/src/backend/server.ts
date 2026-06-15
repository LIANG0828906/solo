import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import {
  initializeData,
  updateSalesTrend,
  updateCategorySales,
  updateHeatmap,
  getSalesTrend,
  getCategorySales,
  getHeatmap,
  getDrillDownData,
} from './dataStream';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface Client {
  id: string;
  ws: WebSocket;
  channels: Set<string>;
}

const clients = new Map<string, Client>();
let frequency = 1000;
let dataInterval: NodeJS.Timeout | null = null;

initializeData();

function broadcast(channel: string, data: unknown): void {
  const message = JSON.stringify({
    type: 'data',
    channel,
    data,
    timestamp: Date.now(),
  });

  clients.forEach((client) => {
    if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

function startDataStream(): void {
  if (dataInterval) {
    clearInterval(dataInterval);
  }

  dataInterval = setInterval(() => {
    const salesTrend = updateSalesTrend();
    broadcast('sales-trend', salesTrend);

    const categorySales = updateCategorySales();
    broadcast('category-sales', categorySales);

    const heatmap = updateHeatmap();
    broadcast('heatmap', heatmap);
  }, frequency);
}

function sendInitialData(client: Client): void {
  if (client.channels.has('sales-trend')) {
    client.ws.send(
      JSON.stringify({
        type: 'data',
        channel: 'sales-trend',
        data: getSalesTrend(),
        timestamp: Date.now(),
      })
    );
  }
  if (client.channels.has('category-sales')) {
    client.ws.send(
      JSON.stringify({
        type: 'data',
        channel: 'category-sales',
        data: getCategorySales(),
        timestamp: Date.now(),
      })
    );
  }
  if (client.channels.has('heatmap')) {
    client.ws.send(
      JSON.stringify({
        type: 'data',
        channel: 'heatmap',
        data: getHeatmap(),
        timestamp: Date.now(),
      })
    );
  }
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const client: Client = {
    id: clientId,
    ws,
    channels: new Set(),
  };
  clients.set(clientId, client);

  ws.send(
    JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: Date.now(),
    })
  );

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      switch (message.type) {
        case 'register': {
          if (message.channel) {
            client.channels.add(message.channel);
            sendInitialData(client);
          }
          break;
        }
        case 'unregister': {
          if (message.channel) {
            client.channels.delete(message.channel);
          }
          break;
        }
        case 'setFrequency': {
          if (typeof message.frequency === 'number' && message.frequency > 0) {
            frequency = message.frequency;
            startDataStream();
          }
          break;
        }
        case 'drilldown': {
          const { chartType, dataPoint } = message;
          const result = getDrillDownData(chartType, dataPoint);
          ws.send(
            JSON.stringify({
              type: 'drilldown',
              data: result,
              timestamp: Date.now(),
            })
          );
          break;
        }
        case 'reset': {
          initializeData();
          sendInitialData(client);
          break;
        }
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(clientId);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: clients.size });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket path: /ws`);
  startDataStream();
});

export default server;
