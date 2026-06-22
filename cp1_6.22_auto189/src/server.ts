import express from 'express';
import cors from 'cors';
import { dataStore, Work, Appointment } from './dataStore';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/portfolios', (_req, res) => {
  res.json(dataStore.getPortfolios());
});

app.get('/api/portfolios/:id', (req, res) => {
  const portfolio = dataStore.getPortfolioById(req.params.id);
  if (portfolio) {
    res.json(portfolio);
  } else {
    res.status(404).json({ error: 'Portfolio not found' });
  }
});

app.get('/api/works', (req, res) => {
  const portfolioId = req.query.portfolioId as string | undefined;
  res.json(dataStore.getWorks(portfolioId));
});

app.get('/api/works/:id', (req, res) => {
  const work = dataStore.getWorkById(req.params.id);
  if (work) {
    res.json(work);
  } else {
    res.status(404).json({ error: 'Work not found' });
  }
});

app.post('/api/works', (req, res) => {
  const body = req.body as Omit<Work, 'id' | 'likes' | 'isLiked' | 'createdAt'>;
  
  if (!body.portfolioId || !body.title || !body.imageUrl || !body.thumbnailUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newWork = dataStore.createWork(body);
  res.status(201).json(newWork);
});

app.put('/api/works/:id', (req, res) => {
  const updatedWork = dataStore.updateWork(req.params.id, req.body);
  if (updatedWork) {
    res.json(updatedWork);
  } else {
    res.status(404).json({ error: 'Work not found' });
  }
});

app.delete('/api/works/:id', (req, res) => {
  const success = dataStore.deleteWork(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Work not found' });
  }
});

app.post('/api/works/:id/like', (req, res) => {
  const result = dataStore.toggleLike(req.params.id);
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Work not found' });
  }
});

app.get('/api/appointments', (_req, res) => {
  res.json(dataStore.getAppointments());
});

app.post('/api/appointments', (req, res) => {
  const body = req.body as Omit<Appointment, 'id' | 'status' | 'createdAt'>;
  
  if (!body.name || !body.email || !body.serviceType || !body.expectedDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newAppointment = dataStore.createAppointment(body);
  res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id', (req, res) => {
  const { status } = req.body as { status: Appointment['status'] };
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const updatedAppointment = dataStore.updateAppointmentStatus(req.params.id, status);
  if (updatedAppointment) {
    res.json(updatedAppointment);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
