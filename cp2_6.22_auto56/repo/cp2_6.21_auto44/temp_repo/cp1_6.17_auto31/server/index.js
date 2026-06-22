import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const dbFile = path.join(__dirname, 'db.json');
const defaultData = { checkins: [], travelogs: [] };
const db = new Low(new JSONFile(dbFile), defaultData);

await db.read();
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

app.get('/api/checkins', async (req, res) => {
  await db.read();
  res.json({ success: true, data: db.data.checkins });
});

app.post('/api/checkin', async (req, res) => {
  const { name, lat, lng } = req.body;
  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  const newCheckin = {
    id: uuidv4(),
    name: name.substring(0, 20),
    lat: Number(lat),
    lng: Number(lng),
    createdAt: new Date().toISOString(),
    photoUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${name} 旅行风景照片`)}&image_size=landscape_16_9`,
  };
  await db.read();
  db.data.checkins.push(newCheckin);
  await db.write();
  res.json({ success: true, data: newCheckin });
});

app.delete('/api/checkin/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const initialLength = db.data.checkins.length;
  db.data.checkins = db.data.checkins.filter((c) => c.id !== id);
  if (db.data.checkins.length === initialLength) {
    return res.status(404).json({ success: false, message: '签到点不存在' });
  }
  await db.write();
  res.json({ success: true });
});

app.get('/api/travelogs', async (req, res) => {
  await db.read();
  res.json({ success: true, data: db.data.travelogs });
});

app.post('/api/travelog', async (req, res) => {
  const { title, content, checkinIds } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  await db.read();
  const relatedCheckins = db.data.checkins.filter((c) =>
    (checkinIds || []).includes(c.id)
  );
  const photos = relatedCheckins.map((c) => c.photoUrl).filter(Boolean);
  const newTravelog = {
    id: uuidv4(),
    title: title.substring(0, 30),
    content: content.substring(0, 500),
    checkinIds: checkinIds || [],
    coverPhotoUrl: photos[0] || '',
    photos: photos,
    createdAt: new Date().toISOString(),
  };
  db.data.travelogs.push(newTravelog);
  await db.write();
  res.json({ success: true, data: newTravelog });
});

app.delete('/api/travelog/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const initialLength = db.data.travelogs.length;
  db.data.travelogs = db.data.travelogs.filter((t) => t.id !== id);
  if (db.data.travelogs.length === initialLength) {
    return res.status(404).json({ success: false, message: '游记不存在' });
  }
  await db.write();
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`后端服务运行在 http://localhost:${port}`);
});
