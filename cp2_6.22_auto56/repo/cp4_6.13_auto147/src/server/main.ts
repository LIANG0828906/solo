import express from 'express';
import cors from 'cors';
import http from 'http';
import { parseTextToMindMap, initDatabase, saveMindMap, loadMindMap } from './mindmapService';
import { createWebSocketServer } from './webSocketManager';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

createWebSocketServer(server);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate', (req, res) => {
  const { text } = req.body as { text: string };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const mindmap = parseTextToMindMap(text);
    res.json(mindmap);
  } catch (error) {
    console.error('Error generating mind map:', error);
    res.status(500).json({ error: 'Failed to generate mind map' });
  }
});

app.get('/api/mindmap/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const data = loadMindMap(roomCode.toUpperCase());

  if (!data) {
    return res.status(404).json({ error: 'Mind map not found' });
  }

  res.json(data);
});

app.post('/api/mindmap/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const data = req.body;

  try {
    saveMindMap(roomCode.toUpperCase(), data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving mind map:', error);
    res.status(500).json({ error: 'Failed to save mind map' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
