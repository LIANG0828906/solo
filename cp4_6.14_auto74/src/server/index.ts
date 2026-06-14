import express from 'express';
import cors from 'cors';
import { boardManager } from './BoardManager.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/board', (_req, res) => {
  res.json(boardManager.getBoardState());
});

app.post('/card', (req, res) => {
  const card = boardManager.addCard(req.body);
  res.json(card);
});

app.put('/card/:id', (req, res) => {
  const card = boardManager.updateCard(req.params.id, req.body);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  res.json(card);
});

app.delete('/card/:id', (req, res) => {
  const deleted = boardManager.deleteCard(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  res.json({ success: true });
});

app.post('/connection', (req, res) => {
  const conn = boardManager.addConnection(req.body);
  if (!conn) {
    res.status(400).json({ error: 'Invalid connection data' });
    return;
  }
  res.json(conn);
});

app.delete('/connection/:id', (req, res) => {
  const deleted = boardManager.deleteConnection(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }
  res.json({ success: true });
});

app.post('/snapshot', (_req, res) => {
  const snapshot = boardManager.saveSnapshot();
  res.json(snapshot);
});

app.get('/snapshots', (_req, res) => {
  res.json(boardManager.getSnapshots());
});

app.get('/online', (_req, res) => {
  res.json({ count: boardManager.getOnlineCount() });
});

app.get('/events', (req, res) => {
  const clientId = boardManager.addSSEClient(res);
  req.on('close', () => {
    boardManager.removeSSEClient(clientId);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
