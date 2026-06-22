import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const file = join(__dirname, 'db.json');
const defaultData = { checkins: [], travelogs: [] };
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

await db.read();

app.get('/api/checkins', async (req, res) => {
  await db.read();
  res.json(db.data.checkins);
});

app.post('/api/checkin', async (req, res) => {
  await db.read();
  const newCheckin = {
    id: req.body.id,
    name: req.body.name,
    lat: req.body.lat,
    lng: req.body.lng,
    createdAt: req.body.createdAt,
    photo: req.body.photo,
  };
  db.data.checkins.push(newCheckin);
  await db.write();
  res.json(newCheckin);
});

app.delete('/api/checkin/:id', async (req, res) => {
  await db.read();
  const id = req.params.id;
  const initialLength = db.data.checkins.length;
  db.data.checkins = db.data.checkins.filter((c) => c.id !== id);
  if (db.data.checkins.length === initialLength) {
    return res.status(404).json({ error: 'Checkin not found' });
  }
  await db.write();
  res.json({ success: true });
});

app.get('/api/travelogs', async (req, res) => {
  await db.read();
  res.json(db.data.travelogs);
});

app.post('/api/travelog', async (req, res) => {
  await db.read();
  const newTravelog = {
    id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    checkinIds: req.body.checkinIds,
    coverPhoto: req.body.coverPhoto,
    createdAt: req.body.createdAt,
  };
  db.data.travelogs.push(newTravelog);
  await db.write();
  res.json(newTravelog);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
