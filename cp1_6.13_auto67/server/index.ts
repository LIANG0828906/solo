import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { readData, writeData, ensureDataFile } from './fileStore';
import { Exhibit, Booth, Comment } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

ensureDataFile();

app.get('/api/exhibits', (req, res) => {
  const data = readData();
  res.json(data.exhibits);
});

app.post('/api/exhibits', (req, res) => {
  const { name, description, imageUrl, tags } = req.body;
  if (!name || !description || !imageUrl) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const urlPattern = /\.(jpg|jpeg|png|gif)$/i;
  if (!urlPattern.test(imageUrl)) {
    return res.status(400).json({ error: '图片URL格式必须为.jpg/.png/.gif' });
  }
  const data = readData();
  const newExhibit: Exhibit = {
    id: uuidv4(),
    name,
    description,
    imageUrl,
    tags: tags || [],
    likes: 0,
    boothId: null,
  };
  data.exhibits.push(newExhibit);
  writeData(data);
  res.status(201).json(newExhibit);
});

app.put('/api/exhibits/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, tags } = req.body;
  const data = readData();
  const idx = data.exhibits.findIndex((e) => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '展品不存在' });
  }
  if (imageUrl) {
    const urlPattern = /\.(jpg|jpeg|png|gif)$/i;
    if (!urlPattern.test(imageUrl)) {
      return res.status(400).json({ error: '图片URL格式必须为.jpg/.png/.gif' });
    }
  }
  data.exhibits[idx] = {
    ...data.exhibits[idx],
    name: name || data.exhibits[idx].name,
    description: description || data.exhibits[idx].description,
    imageUrl: imageUrl || data.exhibits[idx].imageUrl,
    tags: tags !== undefined ? tags : data.exhibits[idx].tags,
  };
  writeData(data);
  res.json(data.exhibits[idx]);
});

app.delete('/api/exhibits/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const exhibit = data.exhibits.find((e) => e.id === id);
  if (!exhibit) {
    return res.status(404).json({ error: '展品不存在' });
  }
  data.exhibits = data.exhibits.filter((e) => e.id !== id);
  data.booths.forEach((b) => {
    b.exhibitIds = b.exhibitIds.filter((eid) => eid !== id);
  });
  data.comments = data.comments.filter((c) => c.exhibitId !== id);
  writeData(data);
  res.json({ success: true });
});

app.post('/api/exhibits/:id/like', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const idx = data.exhibits.findIndex((e) => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '展品不存在' });
  }
  data.exhibits[idx].likes += 1;
  writeData(data);
  res.json({ likes: data.exhibits[idx].likes });
});

app.get('/api/booths', (req, res) => {
  const data = readData();
  res.json(data.booths);
});

app.post('/api/booths', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: '展位名称必填' });
  }
  const data = readData();
  const nextNumber = data.booths.length > 0 ? Math.max(...data.booths.map((b) => b.number)) + 1 : 1;
  const newBooth: Booth = {
    id: uuidv4(),
    name,
    number: nextNumber,
    exhibitIds: [],
  };
  data.booths.push(newBooth);
  writeData(data);
  res.status(201).json(newBooth);
});

app.put('/api/booths/:id/assign', (req, res) => {
  const { id } = req.params;
  const { exhibitIds } = req.body;
  const data = readData();
  const booth = data.booths.find((b) => b.id === id);
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }
  if (Array.isArray(exhibitIds) && exhibitIds.length > 4) {
    return res.status(400).json({ error: '一个展位最多放4个展品' });
  }
  const currentExhibitIds = new Set(booth.exhibitIds);
  const newExhibitIds = new Set(exhibitIds || []);
  data.booths.forEach((b) => {
    if (b.id !== id) {
      b.exhibitIds = b.exhibitIds.filter((eid) => !newExhibitIds.has(eid));
    }
  });
  data.exhibits.forEach((e) => {
    if (newExhibitIds.has(e.id)) {
      e.boothId = id;
    } else if (currentExhibitIds.has(e.id) && !newExhibitIds.has(e.id)) {
      e.boothId = null;
    }
  });
  booth.exhibitIds = Array.isArray(exhibitIds) ? exhibitIds : booth.exhibitIds;
  writeData(data);
  res.json(booth);
});

app.get('/api/booths/:id/qrcode', async (req, res) => {
  const { id } = req.params;
  const data = readData();
  const booth = data.booths.find((b) => b.id === id);
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }
  const visitorUrl = `${req.protocol}://${req.get('host')}/visitor/${id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(visitorUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    res.json({
      qrCode: qrDataUrl,
      boothNumber: booth.number,
      boothName: booth.name,
      visitorUrl,
    });
  } catch (err) {
    res.status(500).json({ error: '二维码生成失败' });
  }
});

app.get('/api/booths/:id/exhibits', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const booth = data.booths.find((b) => b.id === id);
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }
  const exhibits = data.exhibits.filter((e) => booth.exhibitIds.includes(e.id));
  res.json({ booth, exhibits });
});

app.get('/api/exhibits/:id/comments', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const comments = data.comments.filter((c) => c.exhibitId === id);
  res.json(comments);
});

app.post('/api/exhibits/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: '作者和内容必填' });
  }
  const data = readData();
  const exhibit = data.exhibits.find((e) => e.id === id);
  if (!exhibit) {
    return res.status(404).json({ error: '展品不存在' });
  }
  const newComment: Comment = {
    id: uuidv4(),
    exhibitId: id,
    author,
    content,
    timestamp: Date.now(),
  };
  data.comments.push(newComment);
  writeData(data);
  res.status(201).json(newComment);
});

app.get('/api/booths/:id/poll', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const booth = data.booths.find((b) => b.id === id);
  if (!booth) {
    return res.status(404).json({ error: '展位不存在' });
  }
  const exhibits = data.exhibits.filter((e) => booth.exhibitIds.includes(e.id));
  const exhibitIds = exhibits.map((e) => e.id);
  const comments = data.comments.filter((c) => exhibitIds.includes(c.exhibitId));
  res.json({ exhibits, comments });
});

app.listen(PORT, () => {
  console.log(`ExpoFlow Server running on http://localhost:${PORT}`);
});
