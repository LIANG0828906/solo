import type { VercelRequest, VercelResponse } from '@vercel/node';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { createApp } from './app.js';

const server = http.createServer();
const io = new IOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const app = createApp(io);
server.on('request', app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
