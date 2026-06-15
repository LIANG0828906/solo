import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { setupWebSocket } from './websocket';
import apiRouter from './routes/api';

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
