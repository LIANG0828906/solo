const { v4: uuidv4 } = require('uuid');

let connections = new Map();

function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    const connectionId = uuidv4();
    const connection = {
      id: connectionId,
      ws,
      room: 'default'
    };
    connections.set(connectionId, connection);

    console.log(`Client connected: ${connectionId}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'join' && message.room) {
          connection.room = message.room;
          console.log(`Client ${connectionId} joined room: ${message.room}`);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    ws.on('close', () => {
      connections.delete(connectionId);
      console.log(`Client disconnected: ${connectionId}`);
    });

    ws.send(JSON.stringify({ type: 'connected', id: connectionId }));
  });
}

function broadcastToRoom(room, data) {
  const message = JSON.stringify(data);
  connections.forEach((conn) => {
    if (conn.room === room && conn.ws.readyState === 1) {
      conn.ws.send(message);
    }
  });
}

function broadcastAll(data) {
  const message = JSON.stringify(data);
  connections.forEach((conn) => {
    if (conn.ws.readyState === 1) {
      conn.ws.send(message);
    }
  });
}

function getConnectionCount() {
  return connections.size;
}

module.exports = {
  setupWebSocket,
  broadcastToRoom,
  broadcastAll,
  getConnectionCount
};
