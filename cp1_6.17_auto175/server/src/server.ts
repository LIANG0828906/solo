import express from 'express';
import cors from 'cors';
import { eventService } from './EventService.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/events', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isPublic = req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined;
  const result = eventService.getEvents(page, limit, isPublic);
  res.json(result);
});

app.get('/api/events/:id', (req, res) => {
  const event = eventService.getEventById(req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});

app.post('/api/events', (req, res) => {
  try {
    const newEvent = eventService.createEvent(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.put('/api/events/:id', (req, res) => {
  const updated = eventService.updateEvent(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/events/:id', (req, res) => {
  const deleted = eventService.deleteEvent(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ success: true });
});

app.post('/api/events/:id/like', (req, res) => {
  const updated = eventService.likeEvent(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(updated);
});

app.post('/api/events/:id/comment', (req, res) => {
  const { userId, userName, content } = req.body;
  if (!userId || !userName || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const updated = eventService.addComment(req.params.id, { userId, userName, content });
  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(updated);
});

app.get('/api/community', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const result = eventService.getCommunityTimelines(page, limit);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
