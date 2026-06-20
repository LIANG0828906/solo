const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

app.use(cors());
app.use(express.json());

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.json({ success: false, message: '用户名已存在' });
  }

  const newUser = {
    id: uuidv4(),
    username,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.json({ success: true, userId: newUser.id, username: newUser.username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.json({ success: false, message: '用户名或密码错误' });
  }

  res.json({ success: true, userId: user.id, username: user.username });
});

app.post('/api/records', (req, res) => {
  const { userId, title, content } = req.body;
  const records = readJSON(RECORDS_FILE);

  const newRecord = {
    id: uuidv4(),
    userId,
    title: title || '',
    content: content || '',
    createdAt: new Date().toISOString()
  };

  records.push(newRecord);
  writeJSON(RECORDS_FILE, records);

  res.json({ success: true, recordId: newRecord.id });
});

app.get('/api/records', (req, res) => {
  const { userId } = req.query;
  const records = readJSON(RECORDS_FILE);

  const userRecords = records
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.json({ records: userRecords });
});

app.get('/api/simulation', (req, res) => {
  const { lat, lng, date } = req.query;

  const latitude = parseFloat(lat) || 0;
  const longitude = parseFloat(lng) || 0;

  const latOffset = (latitude / 60) * 60;

  const sunriseMinutes = 6 * 60 + latOffset;
  const sunsetMinutes = 18 * 60 - latOffset;

  function minutesToTime(min) {
    const totalMinutes = Math.round(min);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const timeSlots = [
    {
      id: 'morning',
      name: '清晨',
      emoji: '🌅',
      startTime: minutesToTime(sunriseMinutes - 30),
      endTime: minutesToTime(sunriseMinutes + 30),
      color: '#f4a261',
      recommendedTypes: ['风景', '人像', '剪影']
    },
    {
      id: 'noon',
      name: '正午',
      emoji: '☀️',
      startTime: '11:30',
      endTime: '13:30',
      color: '#ffd93d',
      recommendedTypes: ['建筑', '街拍', '高反差']
    },
    {
      id: 'sunset',
      name: '黄昏',
      emoji: '🌇',
      startTime: minutesToTime(sunsetMinutes - 30),
      endTime: minutesToTime(sunsetMinutes + 30),
      color: '#e76f51',
      recommendedTypes: ['风景', '人像', '逆光']
    },
    {
      id: 'night',
      name: '夜晚',
      emoji: '🌙',
      startTime: minutesToTime(sunsetMinutes + 30),
      endTime: minutesToTime(sunsetMinutes + 90),
      color: '#264653',
      recommendedTypes: ['长曝光', '星空', '城市夜景']
    }
  ];

  res.json({ timeSlots });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
