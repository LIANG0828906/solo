import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let elements = [];
let operationSequence = 0;
const clients = new Set();

console.log('SketchSync WebSocket Server running on ws://localhost:8080');

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  if (elements.length > 0) {
    const snapshotMsg = {
      type: 'snapshot',
      id: 'snapshot_' + Date.now(),
      payload: elements,
      timestamp: Date.now(),
      clientId: 'server',
      sequence: operationSequence,
    };
    ws.send(JSON.stringify(snapshotMsg));
    console.log('Sent snapshot to new client, elements:', elements.length);
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'add') {
        operationSequence++;
        msg.sequence = operationSequence;

        const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
        payload.forEach((el) => {
          const existingIndex = elements.findIndex((e) => e.id === el.id);
          if (existingIndex === -1) {
            elements.push(el);
          }
        });
      } else if (msg.type === 'update') {
        operationSequence++;
        msg.sequence = operationSequence;

        const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
        payload.forEach((el) => {
          const existingIndex = elements.findIndex((e) => e.id === el.id);
          if (existingIndex !== -1) {
            elements[existingIndex] = { ...elements[existingIndex], ...el };
          }
        });
      } else if (msg.type === 'delete') {
        operationSequence++;
        msg.sequence = operationSequence;

        const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
        payload.forEach((el) => {
          elements = elements.filter((e) => e.id !== el.id);
        });
      } else if (msg.type === 'snapshot') {
        const payload = msg.payload;
        if (Array.isArray(payload) && payload.length > elements.length) {
          elements = payload;
          operationSequence = msg.sequence || operationSequence;
        }
      }

      const msgStr = JSON.stringify(msg);
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(msgStr);
        }
      });
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close();
  process.exit(0);
});
