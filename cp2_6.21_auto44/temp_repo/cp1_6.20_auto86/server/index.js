import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'data', 'uploads');
const DIFFS_DIR = path.resolve(__dirname, 'data', 'diffs');
const ROOMS_FILE = path.resolve(DATA_DIR, 'rooms.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DIFFS_DIR, { recursive: true });

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/diffs', express.static(DIFFS_DIR));

const CREATOR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

function readRooms() {
  try {
    const data = fs.readFileSync(ROOMS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeRooms(rooms) {
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, uuidv4() + ext);
    }
  })
});

app.post('/api/rooms', (req, res) => {
  try {
    const { name } = req.body;
    const roomId = uuidv4();
    const userId = uuidv4();
    const colorIndex = 0;
    const user = {
      id: userId,
      name,
      color: CREATOR_COLORS[colorIndex],
      initials: name.charAt(0).toUpperCase()
    };
    const room = {
      id: roomId,
      name,
      collaborators: [user],
      versions: [],
      annotations: [],
      markers: []
    };
    const rooms = readRooms();
    rooms[roomId] = room;
    writeRooms(rooms);
    res.json({ room, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id', (req, res) => {
  try {
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:id/join', (req, res) => {
  try {
    const { name } = req.body;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.collaborators.length >= 6) return res.status(400).json({ error: 'Room is full' });
    const userId = uuidv4();
    const colorIndex = room.collaborators.length;
    const user = {
      id: userId,
      name,
      color: CREATOR_COLORS[colorIndex],
      initials: name.charAt(0).toUpperCase()
    };
    room.collaborators.push(user);
    writeRooms(rooms);
    res.json({ room, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:id/upload', upload.single('image'), (req, res) => {
  try {
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const file = req.file;
    const version = {
      id: uuidv4(),
      url: '/uploads/' + file.filename,
      filename: file.originalname,
      uploadedAt: new Date().toISOString()
    };
    room.versions.push(version);
    writeRooms(rooms);
    res.json({ version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id/annotations', (req, res) => {
  try {
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    let annotations = room.annotations || [];
    if (req.query.versionId) {
      annotations = annotations.filter(a => a.versionId === req.query.versionId);
    }
    res.json({ annotations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:id/annotations', (req, res) => {
  try {
    const { versionId, x, y, bubbleX, bubbleY, text, creatorId, creatorName, creatorColor } = req.body;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const annotation = {
      id: uuidv4(),
      versionId,
      x,
      y,
      bubbleX,
      bubbleY,
      text,
      creatorId,
      creatorName,
      creatorColor,
      createdAt: new Date().toISOString(),
      readBy: [creatorId]
    };
    if (!room.annotations) room.annotations = [];
    room.annotations.push(annotation);
    writeRooms(rooms);
    res.json({ annotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/rooms/:id/annotations/:annotationId', (req, res) => {
  try {
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const annotation = (room.annotations || []).find(a => a.id === req.params.annotationId);
    if (!annotation) return res.status(404).json({ error: 'Annotation not found' });
    if (req.body.bubbleX !== undefined) annotation.bubbleX = req.body.bubbleX;
    if (req.body.bubbleY !== undefined) annotation.bubbleY = req.body.bubbleY;
    if (req.body.text !== undefined) annotation.text = req.body.text;
    writeRooms(rooms);
    res.json({ annotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:id/annotations/:annotationId', (req, res) => {
  try {
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.annotations = (room.annotations || []).filter(a => a.id !== req.params.annotationId);
    writeRooms(rooms);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/rooms/:id/annotations/:annotationId/read', (req, res) => {
  try {
    const { userId } = req.body;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const annotation = (room.annotations || []).find(a => a.id === req.params.annotationId);
    if (!annotation) return res.status(404).json({ error: 'Annotation not found' });
    if (!annotation.readBy) annotation.readBy = [];
    if (!annotation.readBy.includes(userId)) {
      annotation.readBy.push(userId);
    }
    writeRooms(rooms);
    res.json({ annotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:id/markAllRead', (req, res) => {
  try {
    const { userId } = req.body;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.annotations) room.annotations = [];
    for (const annotation of room.annotations) {
      if (!annotation.readBy) annotation.readBy = [];
      if (!annotation.readBy.includes(userId)) {
        annotation.readBy.push(userId);
      }
    }
    writeRooms(rooms);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id/markers', (req, res) => {
  try {
    const { version1Id, version2Id } = req.query;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const markers = (room.markers || []).find(
      m => m.version1Id === version1Id && m.version2Id === version2Id
    );
    res.json({ markers: markers || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:id/markers', (req, res) => {
  try {
    const { version1Id, version2Id, points1, points2 } = req.body;
    const rooms = readRooms();
    const room = rooms[req.params.id];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.markers) room.markers = [];
    const existingIndex = room.markers.findIndex(
      m => m.version1Id === version1Id && m.version2Id === version2Id
    );
    const marker = {
      id: uuidv4(),
      version1Id,
      version2Id,
      points1,
      points2
    };
    if (existingIndex >= 0) {
      room.markers[existingIndex] = marker;
    } else {
      room.markers.push(marker);
    }
    writeRooms(rooms);
    res.json({ markers: marker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/diff', upload.fields([{ name: 'image1' }, { name: 'image2' }]), async (req, res) => {
  try {
    const offsetX = Number(req.body.offsetX) || 0;
    const offsetY = Number(req.body.offsetY) || 0;

    const file1 = req.files['image1'][0];
    const file2 = req.files['image2'][0];

    let img1 = sharp(file1.path);
    let img2 = sharp(file2.path);

    const meta1 = await img1.metadata();
    const meta2 = await img2.metadata();

    const maxWidth = Math.max(meta1.width, meta2.width);
    const maxHeight = Math.max(meta1.height, meta2.height);

    img1 = sharp(file1.path).resize(maxWidth, maxHeight);
    img2 = sharp(file2.path).resize(maxWidth, maxHeight);

    if (offsetX !== 0 || offsetY !== 0) {
      img2 = sharp(file2.path)
        .resize(maxWidth, maxHeight)
        .affine([1, 0, 0, 1], {
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: offsetY < 0 ? Math.abs(offsetY) : 0,
          bottom: offsetY > 0 ? offsetY : 0,
          left: offsetX < 0 ? Math.abs(offsetX) : 0,
          right: offsetX > 0 ? offsetX : 0,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .resize(maxWidth, maxHeight);
    }

    const buf1 = await img1.raw().toBuffer();
    const buf2 = await img2.raw().toBuffer();

    const channels = 3;
    const totalPixels = maxWidth * maxHeight;
    const heatmapBuf = Buffer.alloc(totalPixels * channels);

    for (let i = 0; i < totalPixels; i++) {
      const r1 = buf1[i * channels] || 0;
      const g1 = buf1[i * channels + 1] || 0;
      const b1 = buf1[i * channels + 2] || 0;
      const r2 = buf2[i * channels] || 0;
      const g2 = buf2[i * channels + 1] || 0;
      const b2 = buf2[i * channels + 2] || 0;

      const avgDiff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / 3;
      const normalized = Math.min(avgDiff / 128, 1.0);

      let r, g, b;
      if (normalized < 0.25) {
        r = normalized * 4 * 255;
        g = 0;
        b = 0;
      } else if (normalized < 0.5) {
        r = 255;
        g = (normalized - 0.25) * 4 * 255;
        b = 0;
      } else if (normalized < 0.75) {
        r = 255;
        g = 255;
        b = (normalized - 0.5) * 4 * 128;
      } else {
        r = 255;
        g = 255;
        b = 128 + (normalized - 0.75) * 4 * 127;
      }

      heatmapBuf[i * channels] = Math.round(r);
      heatmapBuf[i * channels + 1] = Math.round(g);
      heatmapBuf[i * channels + 2] = Math.round(b);
    }

    const diffFilename = uuidv4() + '.png';
    const diffPath = path.resolve(DIFFS_DIR, diffFilename);

    await sharp(heatmapBuf, {
      raw: {
        width: maxWidth,
        height: maxHeight,
        channels: 3
      }
    })
      .png()
      .toFile(diffPath);

    res.sendFile(diffPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/export', (req, res) => {
  try {
    const { roomId, annotations, diffImageUrl } = req.body;
    const rooms = readRooms();
    const room = rooms[roomId];

    let md = '';
    md += `# ${room ? room.name : 'Room'} (${roomId})\n\n`;

    if (diffImageUrl) {
      md += `## Diff Image\n\n![Diff](${diffImageUrl})\n\n`;
    }

    md += `## Annotations\n\n`;

    for (const ann of annotations) {
      md += `### Annotation by ${ann.creatorName}\n`;
      md += `- **Timestamp:** ${ann.createdAt}\n`;
      md += `- **Position:** (${ann.x}, ${ann.y})\n`;
      md += `- **Bubble Position:** (${ann.bubbleX}, ${ann.bubbleY})\n`;
      md += `- **Text:** ${ann.text}\n\n`;
    }

    res.json({ markdown: md });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
