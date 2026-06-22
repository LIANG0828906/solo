import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  addArtwork,
  getAllArtworks,
  likeArtwork,
  addComment,
  getComments,
  addVisitor,
  removeVisitor,
  updateVisitorPosition,
  getVisitors,
} from './store.js';
import { upload, imageToBase64 } from './upload.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

app.post('/api/artworks', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const { title, dimensions, year } = req.body;
  const imageBase64 = imageToBase64(file.buffer, file.mimetype);
  const artwork = addArtwork(title, dimensions, year, imageBase64);
  res.status(201).json(artwork);
});

app.get('/api/artworks', (_req, res) => {
  res.json(getAllArtworks());
});

app.post('/api/artworks/:id/like', (req, res) => {
  const likes = likeArtwork(req.params.id);
  if (likes === null) {
    res.status(404).json({ error: 'Artwork not found' });
    return;
  }
  res.json({ likes });
});

app.get('/api/artworks/:id/comments', (req, res) => {
  const comments = getComments(req.params.id);
  if (comments === null) {
    res.status(404).json({ error: 'Artwork not found' });
    return;
  }
  res.json(comments);
});

app.post('/api/artworks/:id/comments', (req, res) => {
  const { text } = req.body;
  const comment = addComment(req.params.id, text);
  if (comment === null) {
    res.status(404).json({ error: 'Artwork not found' });
    return;
  }
  res.status(201).json(comment);
});

app.get('/api/visitors', (_req, res) => {
  res.json({ count: getVisitors().length });
});

app.get('/api/test-image', (_req, res) => {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRElEQkSuQmCC',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': pixel.length,
  });
  res.end(pixel);
});

io.on('connection', (socket) => {
  const visitorId = uuidv4();
  addVisitor(visitorId);
  socket.emit('visitor:join', { id: visitorId });

  socket.on('visitor:position', (data: { x: number; y: number; z: number }) => {
    updateVisitorPosition(visitorId, data.x, data.y, data.z);
  });

  socket.on('disconnect', () => {
    removeVisitor(visitorId);
  });
});

setInterval(() => {
  const visitors = getVisitors();
  io.emit('visitors:update', {
    count: visitors.length,
    positions: visitors.map((v) => ({ id: v.id, x: v.position.x, y: v.position.y, z: v.position.z })),
  });
}, 2000);

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
