import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const readData = () => {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

app.get('/api/dashboard', (req, res) => {
  const data = readData();
  const totalGigs = data.gigs.length;
  const totalEquipment = data.equipment.length;
  
  const matureCount = data.rehearsals.filter(r => r.stage === 'mature').length;
  const rehearsalCompletionRate = data.rehearsals.length > 0 
    ? Math.round((matureCount / data.rehearsals.length) * 100) 
    : 0;
  
  let pendingItems = 0;
  data.gigs.forEach(gig => {
    pendingItems += gig.members.filter(m => m.status === 'pending').length;
  });
  pendingItems += data.equipment.filter(e => e.status === 'repair').length;
  
  res.json({
    totalGigs,
    totalEquipment,
    rehearsalCompletionRate,
    pendingItems
  });
});

app.get('/api/gigs', (req, res) => {
  const data = readData();
  const gigs = [...data.gigs].sort((a, b) => a.order - b.order);
  res.json(gigs);
});

app.post('/api/gigs', (req, res) => {
  const data = readData();
  const newGig = {
    ...req.body,
    id: uuidv4(),
    order: data.gigs.length
  };
  data.gigs.push(newGig);
  writeData(data);
  res.json(newGig);
});

app.put('/api/gigs/:id', (req, res) => {
  const data = readData();
  const index = data.gigs.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gig not found' });
  }
  data.gigs[index] = { ...data.gigs[index], ...req.body };
  writeData(data);
  res.json(data.gigs[index]);
});

app.delete('/api/gigs/:id', (req, res) => {
  const data = readData();
  data.gigs = data.gigs.filter(g => g.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.put('/api/gigs/reorder', (req, res) => {
  const data = readData();
  const { ids } = req.body;
  ids.forEach((id, index) => {
    const gig = data.gigs.find(g => g.id === id);
    if (gig) {
      gig.order = index;
    }
  });
  writeData(data);
  res.json({ success: true });
});

app.get('/api/equipment', (req, res) => {
  const data = readData();
  let equipment = [...data.equipment];
  
  const { type, search } = req.query;
  if (type && type !== 'all') {
    equipment = equipment.filter(e => e.type === type);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    equipment = equipment.filter(e => 
      e.name.toLowerCase().includes(searchLower) ||
      e.type.toLowerCase().includes(searchLower)
    );
  }
  
  res.json(equipment);
});

app.post('/api/equipment', (req, res) => {
  const data = readData();
  const newEq = {
    ...req.body,
    id: uuidv4(),
    repairRecords: req.body.repairRecords || [],
    borrowRecords: req.body.borrowRecords || []
  };
  data.equipment.push(newEq);
  writeData(data);
  res.json(newEq);
});

app.put('/api/equipment/:id', (req, res) => {
  const data = readData();
  const index = data.equipment.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipment not found' });
  }
  data.equipment[index] = { ...data.equipment[index], ...req.body };
  writeData(data);
  res.json(data.equipment[index]);
});

app.delete('/api/equipment/:id', (req, res) => {
  const data = readData();
  data.equipment = data.equipment.filter(e => e.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.get('/api/rehearsals', (req, res) => {
  const data = readData();
  res.json(data.rehearsals);
});

app.post('/api/rehearsals', (req, res) => {
  const data = readData();
  const newReh = {
    ...req.body,
    id: uuidv4()
  };
  data.rehearsals.push(newReh);
  writeData(data);
  res.json(newReh);
});

app.put('/api/rehearsals/:id', (req, res) => {
  const data = readData();
  const index = data.rehearsals.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Rehearsal not found' });
  }
  data.rehearsals[index] = { ...data.rehearsals[index], ...req.body };
  writeData(data);
  res.json(data.rehearsals[index]);
});

app.delete('/api/rehearsals/:id', (req, res) => {
  const data = readData();
  data.rehearsals = data.rehearsals.filter(r => r.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.get('/api/members', (req, res) => {
  const data = readData();
  res.json(data.members);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
