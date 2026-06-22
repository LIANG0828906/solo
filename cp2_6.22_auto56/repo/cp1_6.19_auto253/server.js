import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import GIFEncoder from 'gif-encoder-2';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3002;
const GRID_SIZE = 24;
const GIF_PIXEL_SIZE = 8;
const GIF_SIZE = GRID_SIZE * GIF_PIXEL_SIZE;

const gifCache = new Map();
let users = [];
let frames = [];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function buildFrameBuffer(frameData) {
  const buffer = Buffer.alloc(GIF_SIZE * GIF_SIZE * 4);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = frameData[y][x];
      let r, g, b, a;
      if (color) {
        const rgb = hexToRgb(color);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
        a = 255;
      } else {
        const isEven = (x + y) % 2 === 0;
        if (isEven) {
          r = 58; g = 58; b = 92;
        } else {
          r = 45; g = 45; b = 68;
        }
        a = 255;
      }
      for (let py = 0; py < GIF_PIXEL_SIZE; py++) {
        for (let px = 0; px < GIF_PIXEL_SIZE; px++) {
          const idx = ((y * GIF_PIXEL_SIZE + py) * GIF_SIZE + (x * GIF_PIXEL_SIZE + px)) * 4;
          buffer[idx] = r;
          buffer[idx + 1] = g;
          buffer[idx + 2] = b;
          buffer[idx + 3] = a;
        }
      }
    }
  }
  return buffer;
}

app.post('/api/gif', (req, res) => {
  try {
    const { frames: reqFrames, delay = 100 } = req.body;
    if (!reqFrames || reqFrames.length < 2) {
      return res.json({ success: false, error: '至少需要2帧' });
    }

    const encoder = new GIFEncoder(GIF_SIZE, GIF_SIZE);
    const chunks = [];

    encoder.on('data', (chunk) => chunks.push(chunk));
    encoder.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const id = `gif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      gifCache.set(id, buffer);
      if (gifCache.size > 50) {
        const firstKey = gifCache.keys().next().value;
        gifCache.delete(firstKey);
      }
      const base64 = buffer.toString('base64');
      res.json({ success: true, url: `/api/gif/${id}`, base64 });
    });

    encoder.setDelay(delay);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    for (const frame of reqFrames) {
      const buffer = buildFrameBuffer(frame.data);
      encoder.addFrame(buffer);
    }

    encoder.finish();
  } catch (err) {
    console.error('GIF合成错误:', err);
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/gif/:id', (req, res) => {
  const { id } = req.params;
  const buffer = gifCache.get(id);
  if (!buffer) {
    return res.status(404).json({ success: false, error: 'GIF不存在' });
  }
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});

app.post('/api/export', (req, res) => {
  try {
    const { frames: reqFrames } = req.body;
    if (!reqFrames || reqFrames.length === 0) {
      return res.json({ success: false, error: '没有帧数据' });
    }
    res.json({ success: true, message: '请在前端使用JSZip导出' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('user-join', (user) => {
    const existing = users.findIndex((u) => u.id === user.id);
    if (existing >= 0) {
      users[existing] = { ...user, socketId: socket.id };
    } else {
      users.push({ ...user, socketId: socket.id });
    }
    io.emit('user-list', users.map(({ socketId, ...rest }) => rest));
    if (frames.length > 0) {
      socket.emit('frames-init', frames, frames[0]?.id);
    }
  });

  socket.on('frame-update', ({ frameId, x, y, color }) => {
    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      frame.data[y][x] = color;
      socket.broadcast.emit('frame-update', frameId, x, y, color);
    }
  });

  socket.on('frames-update', (newFrames) => {
    frames = newFrames.map((f) => ({
      id: f.id,
      data: f.data.map((row) => [...row]),
      editorId: f.editorId
    }));
    socket.broadcast.emit('frames-update', frames);
  });

  socket.on('frame-lock', ({ frameId, userId }) => {
    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      frame.editorId = userId;
      socket.broadcast.emit('frame-lock', frameId, userId);
    }
  });

  socket.on('disconnect', () => {
    const user = users.find((u) => u.socketId === socket.id);
    if (user) {
      frames = frames.map((f) =>
        f.editorId === user.id ? { ...f, editorId: undefined } : f
      );
      users = users.filter((u) => u.socketId !== socket.id);
      io.emit('user-list', users.map(({ socketId, ...rest }) => rest));
      frames.forEach((f) => {
        if (f.editorId === undefined) {
          io.emit('frame-lock', f.id, undefined);
        }
      });
    }
    console.log('用户断开:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
