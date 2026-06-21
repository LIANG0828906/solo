import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'trips.json');

app.use(cors());
app.use(express.json());

function readTrips() {
  if (!fs.existsSync(DATA_FILE)) {
    return { trips: [] };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeTrips(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateNote(title, location, rating) {
  const adjectives = ['古老', '静谧', '浪漫', '神秘', '壮丽', '优雅', '温馨', '迷人', '梦幻', '醉人'];
  const feelings = ['漫步', '徜徉', '驻足', '沉醉', '流连忘返', '心旷神怡', '回味无穷', '难以忘怀'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const feeling = feelings[Math.floor(Math.random() * feelings.length)];
  
  const ratingWords = {
    1: '略显平淡',
    2: '还不错',
    3: '值得一去',
    4: '非常棒',
    5: '完美体验'
  };
  
  let note = `在${adj}的${location}${feeling}，`;
  note += `${title}的经历让我${ratingWords[rating] || '印象深刻'}。`;
  note += `每一个细节都充满了独特的魅力，`;
  note += `这次旅行不仅是视觉上的盛宴，更是心灵的洗礼。`;
  note += `我会永远珍藏这份美好的回忆。`;
  
  if (note.length > 200) {
    note = note.substring(0, 197) + '...';
  }
  
  return note;
}

function generateMarkdown(trips) {
  const groupedByDate = {};
  
  trips.forEach(trip => {
    if (!groupedByDate[trip.date]) {
      groupedByDate[trip.date] = [];
    }
    groupedByDate[trip.date].push(trip);
  });
  
  const dates = Object.keys(groupedByDate).sort();
  let markdown = '# 旅行笔记\n\n';
  
  dates.forEach(date => {
    const dayTrips = groupedByDate[date].sort((a, b) => a.order - b.order);
    markdown += `## ${date}\n\n`;
    markdown += `### 行程列表\n\n`;
    
    dayTrips.forEach((trip, index) => {
      const stars = '★'.repeat(trip.rating) + '☆'.repeat(5 - trip.rating);
      markdown += `${index + 1}. **${trip.title}** - ${trip.location} (${trip.duration}分钟) ${stars}\n`;
    });
    
    markdown += `\n### 旅行感悟\n\n`;
    
    dayTrips.forEach(trip => {
      if (trip.note) {
        markdown += `#### ${trip.title}\n\n`;
        markdown += `${trip.note}\n\n`;
      }
    });
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

app.get('/api/trips', (req, res) => {
  const { date } = req.query;
  const data = readTrips();
  
  let trips = data.trips;
  
  if (date) {
    trips = trips.filter(trip => trip.date === date);
  }
  
  trips.sort((a, b) => a.order - b.order);
  
  res.json(trips);
});

app.get('/api/trips/all', (req, res) => {
  const data = readTrips();
  res.json(data.trips);
});

app.post('/api/trips', (req, res) => {
  const data = readTrips();
  const newTrip = {
    id: uuidv4(),
    date: req.body.date,
    title: req.body.title,
    location: req.body.location,
    duration: req.body.duration || 60,
    rating: req.body.rating || 3,
    description: req.body.description || '',
    tag: req.body.tag || '探索',
    note: req.body.note || '',
    order: req.body.order !== undefined ? req.body.order : data.trips.length,
  };
  
  data.trips.push(newTrip);
  writeTrips(data);
  
  res.status(201).json(newTrip);
});

app.put('/api/trips/:id', (req, res) => {
  const data = readTrips();
  const tripIndex = data.trips.findIndex(trip => trip.id === req.params.id);
  
  if (tripIndex === -1) {
    return res.status(404).json({ error: '行程不存在' });
  }
  
  data.trips[tripIndex] = {
    ...data.trips[tripIndex],
    ...req.body,
    id: data.trips[tripIndex].id,
  };
  
  writeTrips(data);
  res.json(data.trips[tripIndex]);
});

app.delete('/api/trips/:id', (req, res) => {
  const data = readTrips();
  const tripIndex = data.trips.findIndex(trip => trip.id === req.params.id);
  
  if (tripIndex === -1) {
    return res.status(404).json({ error: '行程不存在' });
  }
  
  data.trips.splice(tripIndex, 1);
  writeTrips(data);
  
  res.json({ success: true });
});

app.post('/api/notes/generate', (req, res) => {
  const { title, location, rating } = req.body;
  const note = generateNote(title, location, rating || 3);
  res.json({ note });
});

app.post('/api/export', (req, res) => {
  const { startDate, endDate } = req.body;
  const data = readTrips();
  
  let trips = data.trips;
  
  if (startDate) {
    trips = trips.filter(trip => trip.date >= startDate);
  }
  if (endDate) {
    trips = trips.filter(trip => trip.date <= endDate);
  }
  
  const content = generateMarkdown(trips);
  const today = new Date().toISOString().split('T')[0];
  const filename = `旅行笔记_${today}.md`;
  
  res.json({ content, filename });
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
