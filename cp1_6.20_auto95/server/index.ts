import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  getSeries,
  getSeriesById,
  getUserById,
  updateUser,
  getAuctions,
  getAuctionById,
  getTransactionsByUser,
  getNotificationsByUser,
  markNotificationRead,
  getAllArtworks,
  getArtworkById
} from './dataStore';
import { buyBox, createAuction, placeBid, finalizeAuction } from './auctionEngine';
import { seedDatabase } from './seedData';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/series', async (_req, res) => {
  const series = await getSeries();
  res.json(series);
});

app.get('/api/series/:id', async (req, res) => {
  const s = await getSeriesById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

app.get('/api/artworks', async (_req, res) => {
  const artworks = await getAllArtworks();
  res.json(artworks);
});

app.get('/api/artworks/:id', async (req, res) => {
  const a = await getArtworkById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json(a);
});

app.post('/api/boxes/buy', async (req, res) => {
  const { seriesId, userId } = req.body;
  const result = await buyBox(seriesId, userId);
  if ('error' in result) return res.status(400).json(result);
  res.json(result);
});

app.get('/api/users/:id', async (req, res) => {
  const u = await getUserById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

app.put('/api/users/:id', async (req, res) => {
  const existing = await getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = { ...existing, ...req.body };
  await updateUser(updated);
  res.json(updated);
});

app.get('/api/users/:id/transactions', async (req, res) => {
  const txs = await getTransactionsByUser(req.params.id);
  res.json(txs);
});

app.get('/api/users/:id/notifications', async (req, res) => {
  const notifs = await getNotificationsByUser(req.params.id);
  res.json(notifs);
});

app.post('/api/notifications/:id/read', async (req, res) => {
  await markNotificationRead(req.params.id);
  res.json({ ok: true });
});

app.get('/api/auctions', async (_req, res) => {
  const auctions = await getAuctions();
  const now = Date.now();
  for (const a of auctions) {
    if (a.status === 'active' && now >= a.endTime) {
      a.status = 'ended';
      await finalizeAuction(a);
    }
  }
  res.json((await getAuctions()).sort((a, b) => b.startTime - a.startTime));
});

app.get('/api/auctions/:id', async (req, res) => {
  const a = await getAuctionById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (a.status === 'active' && Date.now() >= a.endTime) {
    a.status = 'ended';
    await finalizeAuction(a);
    const updated = await getAuctionById(req.params.id);
    return res.json(updated);
  }
  res.json(a);
});

app.post('/api/auctions', async (req, res) => {
  const { artworkId, sellerId, startingPrice, duration } = req.body;
  const result = await createAuction(artworkId, sellerId, startingPrice, duration);
  if ('error' in result) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/auctions/:id/bid', async (req, res) => {
  const { userId, amount } = req.body;
  const result = await placeBid(req.params.id, userId, amount);
  if ('error' in result) return res.status(400).json(result);
  res.json(result);
});

async function start() {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`[server] Cyber Art Box API running on port ${PORT}`);
  });
}

start();
