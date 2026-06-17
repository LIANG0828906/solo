import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbFile = join(__dirname, 'db.json');
const defaultData = { checkins: [], travelogs: [] };
const db = new Low(new JSONFile(dbFile), defaultData);

await db.read();
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

app.get('/api/checkins', async (req, res) => {
  await db.read();
  const checkins = db.data.checkins.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(checkins);
});

app.post('/api/checkin', async (req, res) => {
  await db.read();
  const { name, lat, lng, imageUrl } = req.body;
  
  if (!name || !lat || !lng) {
    return res.status(400).json({ error: '名称和坐标是必需的' });
  }

  const newCheckin = {
    id: uuidv4(),
    name: String(name).slice(0, 20),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    imageUrl: imageUrl || `https://picsum.photos/seed/${uuidv4()}/600/400`,
    createdAt: new Date().toISOString(),
  };

  db.data.checkins.push(newCheckin);
  await db.write();
  res.status(201).json(newCheckin);
});

app.delete('/api/checkin/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const initialLength = db.data.checkins.length;
  db.data.checkins = db.data.checkins.filter((c) => c.id !== id);
  
  if (db.data.checkins.length === initialLength) {
    return res.status(404).json({ error: '签到点不存在' });
  }
  
  await db.write();
  res.json({ message: '删除成功' });
});

app.get('/api/travelogs', async (req, res) => {
  await db.read();
  const travelogs = db.data.travelogs.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(travelogs);
});

app.get('/api/travelog/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const travelog = db.data.travelogs.find((t) => t.id === id);
  
  if (!travelog) {
    return res.status(404).json({ error: '游记不存在' });
  }
  
  res.json(travelog);
});

app.post('/api/travelog', async (req, res) => {
  await db.read();
  const { title, content, checkinIds } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容是必需的' });
  }

  const checkins = db.data.checkins.filter((c) => 
    checkinIds && checkinIds.includes(c.id)
  );

  const coverImage = checkins.length > 0 
    ? checkins[0].imageUrl 
    : `https://picsum.photos/seed/${uuidv4()}/800/600`;

  const images = checkins.map((c) => c.imageUrl);

  const newTravelog = {
    id: uuidv4(),
    title: String(title).slice(0, 30),
    content: String(content).slice(0, 500),
    checkinIds: checkinIds || [],
    checkins: checkins,
    coverImage,
    images: images.length > 0 ? images : [coverImage],
    createdAt: new Date().toISOString(),
  };

  db.data.travelogs.push(newTravelog);
  await db.write();
  res.status(201).json(newTravelog);
});

app.delete('/api/travelog/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const initialLength = db.data.travelogs.length;
  db.data.travelogs = db.data.travelogs.filter((t) => t.id !== id);
  
  if (db.data.travelogs.length === initialLength) {
    return res.status(404).json({ error: '游记不存在' });
  }
  
  await db.write();
  res.json({ message: '删除成功' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
