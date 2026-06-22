const { WebSocketServer } = require('ws');
const { Doc, applyUpdate } = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocketServer({ port: 1234 });

const docs = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const room = url.searchParams.get('room') || 'default';
  console.log(`[y-websocket] New connection for room: ${room}`);
  setupWSConnection(ws, req, { doc: getDoc(room) });
});

function getDoc(room) {
  if (!docs.has(room)) {
    docs.set(room, new Doc());
  }
  return docs.get(room);
}

console.log('[y-websocket] Server running on ws://localhost:1234');
