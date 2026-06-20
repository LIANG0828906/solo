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
const PORT = 3002;

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
  const safeName = Buffer.from(plant.name).toString('base64').replace(/=/g, '');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="plant-report.pdf"; filename*=UTF-8''${encodeURIComponent(plant.name)}-report.pdf`
  );
  res.send(Buffer.from(pdfBuffer));
});

app.post('/api/compress-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const maxSizeMB = Number(req.query.maxSizeMB) || 2;
  try {
    let quality = 90;
    let outputBuffer = null;
    let currentSize = Infinity;
    while (quality >= 30 && currentSize > maxSizeMB * 1024 * 1024) {
      outputBuffer = await sharp(req.file.buffer)
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
      currentSize = outputBuffer.length;
      quality -= 10;
    }
    if (!outputBuffer) {
      outputBuffer = await sharp(req.file.buffer)
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 30 })
        .toBuffer();
    }
    const photoId = uuidv4();
    const filename = `${photoId}.jpg`;
    const filePath = join(uploadDir, filename);
    fs.writeFileSync(filePath, outputBuffer);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', outputBuffer.length);
    res.json({
      url: `/uploads/${filename}`,
      size: outputBuffer.length,
      quality,
      width: 1280,
      height: 1280,
    });
  } catch (err) {
    console.error('Compress image error:', err);
    res.status(500).json({ error: 'Failed to compress image' });
  }
});

app.get('/api/export-pdf/:plantId', (req, res) => {
  const plant = db.data.plants.find((p) => p.id === req.params.plantId);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${plant.name} - 生长日记报告</title>
<style>
  body { font-family: -apple-system, 'Microsoft YaHei', sans-serif; padding: 40px; color: #2d3e2d; }
  h1 { color: #3a7a3a; border-bottom: 2px solid #6bb36b; padding-bottom: 10px; }
  h2 { color: #4a8f4a; margin-top: 30px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
  .info-item { background: #e8f5e0; padding: 10px 14px; border-radius: 8px; }
  .info-label { font-size: 12px; color: #6b7c6b; }
  .info-value { font-size: 16px; font-weight: 600; margin-top: 2px; }
  .log-item { padding: 10px 12px; margin: 6px 0; background: #faf8f0; border-left: 3px solid #4a8f4a; border-radius: 4px; }
  .log-type { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; color: white; margin-right: 8px; }
  .log-water { background: #4a9eff; }
  .log-fertilize { background: #f0a040; }
  .log-repot { background: #a060d0; }
  .log-note { background: #708090; }
  .log-date { font-size: 12px; color: #6b7c6b; margin-top: 4px; }
  .photo-section { margin: 16px 0; }
  .photo-item { display: inline-block; margin: 8px; border: 2px solid #d0d8c8; border-radius: 8px; padding: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #d0d8c8; font-size: 12px; color: #6b7c6b; text-align: center; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; background: #6bb36b; color: white; font-size: 13px; }
</style>
</head>
<body>
  <h1>🌿 ${plant.name}</h1>
  <p><span class="status-badge">${plant.status}</span> &nbsp; <em>${plant.species}</em></p>
  <h2>📋 基本信息</h2>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">品种</div><div class="info-value">${plant.species}</div></div>
    <div class="info-item"><div class="info-label">种植日期</div><div class="info-value">${new Date(plant.plantDate).toLocaleDateString('zh-CN')}</div></div>
    <div class="info-item"><div class="info-label">种植天数</div><div class="info-value">${Math.floor((Date.now() - plant.plantDate) / (1000 * 60 * 60 * 24))} 天</div></div>
    <div class="info-item"><div class="info-label">当前状态</div><div class="info-value">${plant.status}</div></div>
  </div>
  <h2>🌱 养护规则</h2>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">浇水频率</div><div class="info-value">每 ${plant.careRules.waterFrequency} 天</div></div>
    <div class="info-item"><div class="info-label">施肥周期</div><div class="info-value">每 ${plant.careRules.fertilizeFrequency} 天</div></div>
    <div class="info-item"><div class="info-label">光照需求</div><div class="info-value">${plant.careRules.lightRequirement}</div></div>
    <div class="info-item"><div class="info-label">适宜温度</div><div class="info-value">${plant.careRules.temperatureMin}°C ~ ${plant.careRules.temperatureMax}°C</div></div>
  </div>
  <h2>📝 养护记录</h2>
  ${
    plant.careLogs.length === 0
      ? '<p style="color:#6b7c6b">暂无养护记录</p>'
      : [...plant.careLogs]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50)
          .map(
            (log) => `
    <div class="log-item">
      <span class="log-type log-${log.type}">${log.type}</span>
      <strong>${log.completed ? '已完成' : '未完成'}</strong>
      ${log.note ? `<br/><span style="font-size:13px">${log.note}</span>` : ''}
      <div class="log-date">${new Date(log.timestamp).toLocaleString('zh-CN')}</div>
    </div>`
          )
          .join('')
  }
  <h2>🖼️ 照片时间线</h2>
  ${
    plant.photo
      ? `<div class="photo-section">
           <div class="photo-item">
             <img src="${plant.photo.url}" alt="照片" style="max-width:300px; border-radius:4px" />
             <p style="font-size:12px;color:#6b7c6b;text-align:center">
               ${new Date(plant.photo.timestamp).toLocaleDateString('zh-CN')}
             </p>
           </div>
         </div>`
      : '<p style="color:#6b7c6b">暂无照片</p>'
  }
  <h2>📌 备注日志</h2>
  ${
    plant.notes && plant.notes.length > 0
      ? plant.notes
          .map(
            (note, i) => `
    <div class="log-item">
      <span class="log-type log-note">备注 ${i + 1}</span>
      ${note}
    </div>`
          )
          .join('')
      : '<p style="color:#6b7c6b">暂无备注</p>'
  }
  <div class="footer">
    植物日记 - 家庭园艺养护助手 ・ 生成于 ${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>`;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;
  const lineHeight = 18;

  doc.setFontSize(22);
  doc.setTextColor(58, 122, 58);
  doc.text(`${plant.name} - 生长日记报告`, pageWidth / 2, y, { align: 'center' });
  y += 40;

  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  const sections = [
    { title: '【基本信息】', items: [
      `品种：${plant.species}`,
      `种植日期：${new Date(plant.plantDate).toLocaleDateString('zh-CN')}`,
      `种植天数：${Math.floor((Date.now() - plant.plantDate) / (1000 * 60 * 60 * 24))} 天`,
      `当前状态：${plant.status}`,
    ]},
    { title: '【养护规则】', items: [
      `浇水：每 ${plant.careRules.waterFrequency} 天`,
      `施肥：每 ${plant.careRules.fertilizeFrequency} 天`,
      `光照：${plant.careRules.lightRequirement}`,
      `温度：${plant.careRules.temperatureMin}°C ~ ${plant.careRules.temperatureMax}°C`,
    ]},
    { title: '【养护记录】', items:
      plant.careLogs.length === 0
        ? ['暂无养护记录']
        : [...plant.careLogs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20)
            .map((log) => {
              const d = new Date(log.timestamp).toLocaleDateString('zh-CN');
              const status = log.completed ? '✓' : '○';
              return `${status} [${d}] ${log.type}${log.note ? ' - ' + log.note : ''}`;
            })
    },
  ];

  for (const section of sections) {
    if (y + lineHeight > 780) { doc.addPage(); y = 40; }
    doc.setFontSize(14);
    doc.setTextColor(74, 143, 74);
    doc.text(section.title, margin, y);
    y += lineHeight + 4;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    for (const item of section.items) {
      if (y + lineHeight > 780) { doc.addPage(); y = 40; }
      const lines = doc.splitTextToSize(item, pageWidth - margin * 2);
      for (const line of lines) {
        if (y + lineHeight > 780) { doc.addPage(); y = 40; }
        doc.text(line, margin + 10, y);
        y += lineHeight;
      }
    }
    y += lineHeight;
  }

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `生成于 ${new Date().toLocaleString('zh-CN')} ・ 植物日记`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 30,
    { align: 'center' }
  );

  const pdfBuffer = doc.output('arraybuffer');
  if (req.query.format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } else {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="plant-diary.pdf"; filename*=UTF-8''${encodeURIComponent(plant.name)}-生长日记.pdf`
    );
    res.send(Buffer.from(pdfBuffer));
  }
});

app.listen(PORT, () => {
  console.log(`Plant Diary server running on http://localhost:${PORT}`);
});
