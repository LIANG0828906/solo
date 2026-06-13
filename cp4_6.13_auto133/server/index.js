const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const { setupWebSocket } = require('./websocket');
const apiRouter = require('./routes/api');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use('/api', apiRouter);

setupWebSocket(wss);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
