import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { jsPDF } = require('jspdf');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

const uploadDir = join(__dirname, '..', 'uploads');
const dbFile = join(__dirname, 'db.json');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const defaultData = {
  plants: [],
  tasks: [],
  completionHistory: [],
};

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

await db.read();
await db.write();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const careRulesDB = {
  default: {
    seedling: { waterFrequency: 2, fertilizeFrequency: 30, lightRequirement: '散射光', temperatureMin: 15, temperatureMax: 25 },
    growing: { waterFrequency: 3, fertilizeFrequency: 14, lightRequirement: '半日照', temperatureMin: 12, temperatureMax: 28 },
    flowering: { waterFrequency: 2, fertilizeFrequency: 7, lightRequirement: '全日照', temperatureMin: 15, temperatureMax: 28 },
    dormant: { waterFrequency: 7, fertilizeFrequency: 60, lightRequirement: '散射光', temperatureMin: 5, temperatureMax: 18 },
  },
  绿萝: {
    seedling: { waterFrequency: 4, fertilizeFrequency: 30, lightRequirement: '耐阴', temperatureMin: 10, temperatureMax: 30 },
    growing: { waterFrequency: 5, fertilizeFrequency: 21, lightRequirement: '散射光', temperatureMin: 12, temperatureMax: 32 },
    flowering: { waterFrequency: 4, fertilizeFrequency: 14, lightRequirement: '散射光', temperatureMin: 15, temperatureMax: 30 },
    dormant: { waterFrequency: 10, fertilizeFrequency: 60, lightRequirement: '耐阴', temperatureMin: 8, temperatureMax: 20 },
  },
  多肉: {
    seedling: { waterFrequency: 7, fertilizeFrequency: 30, lightRequirement: '全日照', temperatureMin: 10, temperatureMax: 28 },
    growing: { waterFrequency: 10, fertilizeFrequency: 30, lightRequirement: '全日照', temperatureMin: 5, temperatureMax: 32 },
    flowering: { waterFrequency: 7, fertilizeFrequency: 14, lightRequirement: '全日照', temperatureMin: 10, temperatureMax: 28 },
    dormant: { waterFrequency: 20, fertilizeFrequency: 90, lightRequirement: '散射光', temperatureMin: 0, temperatureMax: 15 },
  },
  仙人掌: {
    seedling: { waterFrequency: 10, fertilizeFrequency: 30, lightRequirement: '全日照', temperatureMin: 15, temperatureMax: 30 },
    growing: { waterFrequency: 14, fertilizeFrequency: 30, lightRequirement: '全日照', temperatureMin: 10, temperatureMax: 35 },
    flowering: { waterFrequency: 10, fertilizeFrequency: 14, lightRequirement: '全日照', temperatureMin: 15, temperatureMax: 32 },
    dormant: { waterFrequency: 30, fertilizeFrequency: 90, lightRequirement: '半日照', temperatureMin: 5, temperatureMax: 20 },
  },
  月季: {
    seedling: { waterFrequency: 2, fertilizeFrequency: 14, lightRequirement: '全日照', temperatureMin: 10, temperatureMax: 25 },
    growing: { waterFrequency: 2, fertilizeFrequency: 7, lightRequirement: '全日照', temperatureMin: 8, temperatureMax: 30 },
    flowering: { waterFrequency: 1, fertilizeFrequency: 5, lightRequirement: '全日照', temperatureMin: 12, temperatureMax: 28 },
    dormant: { waterFrequency: 7, fertilizeFrequency: 30, lightRequirement: '全日照', temperatureMin: -5, temperatureMax: 15 },
  },
  吊兰: {
    seedling: { waterFrequency: 3, fertilizeFrequency: 21, lightRequirement: '散射光', temperatureMin: 12, temperatureMax: 25 },
    growing: { waterFrequency: 4, fertilizeFrequency: 14, lightRequirement: '半日照', temperatureMin: 10, temperatureMax: 30 },
    flowering: { waterFrequency: 3, fertilizeFrequency: 10, lightRequirement: '半日照', temperatureMin: 15, temperatureMax: 28 },
    dormant: { waterFrequency: 10, fertilizeFrequency: 60, lightRequirement: '散射光', temperatureMin: 5, temperatureMax: 18 },
  },
};

function getDefaultRules(species, status) {
  const speciesRules = careRulesDB[species] || careRulesDB.default;
  return speciesRules[status] || careRulesDB.default.growing;
}

function calculateNextDates(plant) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    nextWaterDate: now + plant.careRules.waterFrequency * dayMs,
    nextFertilizeDate: now + plant.careRules.fertilizeFrequency * dayMs,
    nextRepotDate: now + 180 * dayMs,
  };
}

function updateCompletionHistory(taskType, completed) {
  const today = new Date().toISOString().split('T')[0];
  const history = db.data.completionHistory || [];
  let entry = history.find((h) => h.date === today);
  if (!entry) {
    entry = { date: today, total: 0, completed: 0, rate: 0 };
    history.push(entry);
  }
  entry.total += 1;
  if (completed) entry.completed += 1;
  entry.rate = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  db.data.completionHistory = history.filter(
    (h) => new Date(h.date) >= thirtyDaysAgo
  );
  db.write();
}

app.get('/api/rules/defaults', (req, res) => {
  const { species, status } = req.query;
  const rules = getDefaultRules(species || 'default', status || 'growing');
  res.json(rules);
});

app.get('/api/plants', (req, res) => {
  res.json(db.data.plants);
});

app.get('/api/plants/:id', (req, res) => {
  const plant = db.data.plants.find((p) => p.id === req.params.id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });
  res.json(plant);
});

app.post('/api/plants', async (req, res) => {
  const { name, species, plantDate, status, careRules } = req.body;
  const nextDates = calculateNextDates({ careRules });

  const plant = {
    id: uuidv4(),
    name,
    species,
    plantDate,
    status,
    careRules,
    ...nextDates,
    careLogs: [],
    notes: [],
    createdAt: Date.now(),
  };

  db.data.plants.push(plant);
  await db.write();
  res.status(201).json(plant);
});

app.put('/api/plants/:id', async (req, res) => {
  const idx = db.data.plants.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plant not found' });

  const oldPlant = db.data.plants[idx];
  const updated = { ...oldPlant, ...req.body, id: oldPlant.id };

  if (req.body.careRules) {
    const nextDates = calculateNextDates({ careRules: req.body.careRules });
    updated.nextWaterDate = nextDates.nextWaterDate;
    updated.nextFertilizeDate = nextDates.nextFertilizeDate;
  }

  db.data.plants[idx] = updated;
  await db.write();
  res.json(updated);
});

app.delete('/api/plants/:id', async (req, res) => {
  const idx = db.data.plants.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plant not found' });

  const plant = db.data.plants[idx];
  if (plant.photo) {
    const photoPath = join(uploadDir, plant.photo.id + '.jpg');
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }

  db.data.plants.splice(idx, 1);
  await db.write();
  res.json({ success: true });
});

app.post('/api/plants/:id/photo', upload.single('photo'), async (req, res) => {
  const plant = db.data.plants.find((p) => p.id === req.params.id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const photoId = uuidv4();
  const filename = `${photoId}.jpg`;
  const filePath = join(uploadDir, filename);

  try {
    await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    const stats = fs.statSync(filePath);
    let quality = 85;
    while (stats.size > 2 * 1024 * 1024 && quality > 30) {
      quality -= 10;
      await sharp(req.file.buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toFile(filePath);
    }

    const photo = {
      id: photoId,
      url: `/uploads/${filename}`,
      timestamp: Date.now(),
    };

    plant.photo = photo;
    await db.write();
    res.json(photo);
  } catch (err) {
    console.error('Photo processing error:', err);
    res.status(500).json({ error: 'Failed to process photo' });
  }
});

app.get('/api/tasks/week', (req, res) => {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const end = now + weekMs;

  const tasks = [];
  const taskTypes = [
    { type: 'water', dateField: 'nextWaterDate' },
    { type: 'fertilize', dateField: 'nextFertilizeDate' },
    { type: 'repot', dateField: 'nextRepotDate' },
  ];

  for (const plant of db.data.plants) {
    for (const { type, dateField } of taskTypes) {
      const dueDate = plant[dateField];
      if (dueDate <= end && dueDate >= now - 24 * 60 * 60 * 1000) {
        const taskId = `${plant.id}-${type}-${new Date(dueDate).toISOString().split('T')[0]}`;
        const isCompleted = plant.careLogs.some(
          (log) =>
            log.type === type &&
            log.completed &&
            log.timestamp >= dueDate - 24 * 60 * 60 * 1000 &&
            log.timestamp <= dueDate + 24 * 60 * 60 * 1000
        );
        tasks.push({
          id: taskId,
          plantId: plant.id,
          plantName: plant.name,
          type,
          dueDate,
          completed: isCompleted,
          completedAt: isCompleted ? dueDate : undefined,
        });
      }
    }
  }

  tasks.sort((a, b) => a.dueDate - b.dueDate);
  res.json(tasks);
});

app.post('/api/tasks/:taskId/complete', async (req, res) => {
  const taskId = req.params.taskId;
  const parts = taskId.split('-');
  const plantId = parts[0];
  const type = parts[1];

  const plant = db.data.plants.find((p) => p.id === plantId);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const log = {
    id: uuidv4(),
    type,
    timestamp: now,
    completed: true,
  };
  plant.careLogs.push(log);

  if (type === 'water') {
    plant.nextWaterDate = now + plant.careRules.waterFrequency * dayMs;
  } else if (type === 'fertilize') {
    plant.nextFertilizeDate = now + plant.careRules.fertilizeFrequency * dayMs;
  } else if (type === 'repot') {
    plant.nextRepotDate = now + 180 * dayMs;
  }

  updateCompletionHistory(type, true);
  await db.write();
  res.json({ success: true });
});

app.post('/api/tasks/:taskId/postpone', async (req, res) => {
  const { days } = req.body;
  const taskId = req.params.taskId;
  const parts = taskId.split('-');
  const plantId = parts[0];
  const type = parts[1];

  const plant = db.data.plants.find((p) => p.id === plantId);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });

  const dayMs = days * 24 * 60 * 60 * 1000;

  if (type === 'water') {
    plant.nextWaterDate += dayMs;
  } else if (type === 'fertilize') {
    plant.nextFertilizeDate += dayMs;
  } else if (type === 'repot') {
    plant.nextRepotDate += dayMs;
  }

  await db.write();
  res.json({ success: true });
});

app.get('/api/stats/completion-rates', (req, res) => {
  const history = db.data.completionHistory || [];
  const last30Days = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const entry = history.find((h) => h.date === dateStr);
    last30Days.push(
      entry || { date: dateStr, total: 0, completed: 0, rate: 0 }
    );
  }

  res.json(last30Days);
});

app.get('/api/plants/:id/report', (req, res) => {
  const plant = db.data.plants.find((p) => p.id === req.params.id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(74, 143, 74);
  doc.text('Plant Growth Report', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(plant.name, 105, 30, { align: 'center' });

  let yPos = 45;

  doc.setFontSize(12);
  doc.setTextColor(74, 143, 74);
  doc.text('Basic Information', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const infoLines = [
    `Species: ${plant.species}`,
    `Plant Date: ${new Date(plant.plantDate).toLocaleDateString()}`,
    `Status: ${plant.status}`,
    `Days Planted: ${Math.floor(
      (Date.now() - plant.plantDate) / (1000 * 60 * 60 * 24)
    )} days`,
  ];
  for (const line of infoLines) {
    doc.text(line, 25, yPos);
    yPos += 7;
  }

  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(74, 143, 74);
  doc.text('Care Rules', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const ruleLines = [
    `Water Frequency: every ${plant.careRules.waterFrequency} days`,
    `Fertilize Frequency: every ${plant.careRules.fertilizeFrequency} days`,
    `Light Requirement: ${plant.careRules.lightRequirement}`,
    `Temperature: ${plant.careRules.temperatureMin}C - ${plant.careRules.temperatureMax}C`,
  ];
  for (const line of ruleLines) {
    doc.text(line, 25, yPos);
    yPos += 7;
  }

  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(74, 143, 74);
  doc.text('Care Logs', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const sortedLogs = [...plant.careLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  if (sortedLogs.length === 0) {
    doc.text('No care logs yet.', 25, yPos);
  } else {
    for (const log of sortedLogs) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      const dateStr = new Date(log.timestamp).toLocaleDateString();
      doc.text(`${dateStr} - ${log.type} (${log.completed ? 'completed' : 'pending'})`, 25, yPos);
      yPos += 7;
    }
  }

  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(74, 143, 74);
  doc.text('Photo Timeline', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  if (plant.photo) {
    doc.text(`1 photo on record`, 25, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date(plant.photo.timestamp).toLocaleDateString()}`, 25, yPos);
  } else {
    doc.text('No photos on record.', 25, yPos);
  }

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(plant.name)}-report.pdf"`
  );
  res.send(Buffer.from(pdfBuffer));
});

app.listen(PORT, () => {
  console.log(`Plant Diary server running on http://localhost:${PORT}`);
});
