import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const exhibitions = new Map<string, object>();

app.post('/api/exhibition', (req, res) => {
  const id = uuidv4();
  exhibitions.set(id, req.body);
  res.json({ id });
});

app.get('/api/exhibition/:id', (req, res) => {
  const data = exhibitions.get(req.params.id);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'Exhibition not found' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
