import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let celestialBodies = [
  {
    id: uuidv4(),
    name: '太阳',
    type: 'star',
    mass: 100,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    color: '#ffdd44'
  },
  {
    id: uuidv4(),
    name: '行星1',
    type: 'planet',
    mass: 5,
    position: { x: 50, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 2.5 },
    color: '#6c63ff'
  }
];

app.get('/api/bodies', (req, res) => {
  res.json(celestialBodies);
});

app.post('/api/bodies', (req, res) => {
  const newBody = {
    id: uuidv4(),
    ...req.body
  };
  celestialBodies.push(newBody);
  res.json(newBody);
});

app.put('/api/bodies/:id', (req, res) => {
  const { id } = req.params;
  const index = celestialBodies.findIndex(b => b.id === id);
  if (index !== -1) {
    celestialBodies[index] = { ...celestialBodies[index], ...req.body };
    res.json(celestialBodies[index]);
  } else {
    res.status(404).json({ error: 'Body not found' });
  }
});

app.delete('/api/bodies/:id', (req, res) => {
  const { id } = req.params;
  const index = celestialBodies.findIndex(b => b.id === id);
  if (index !== -1) {
    celestialBodies.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Body not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
