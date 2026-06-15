const express = require('express');
const cors = require('cors');
const {
  getAllBuildings,
  getBuildingTemperatures,
  getBuildingHistory,
  getBuildingById,
} = require('./data');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/buildings', (_req, res) => {
  res.json({ buildings: getAllBuildings() });
});

app.get('/api/building/:id', (req, res) => {
  const building = getBuildingById(req.params.id);
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }
  res.json({ building });
});

app.get('/api/temperature', (req, res) => {
  const time = parseFloat(req.query.time || '14');
  if (isNaN(time) || time < 0 || time > 24) {
    return res.status(400).json({ error: 'Invalid time parameter. Use 0-24.' });
  }
  const buildings = getBuildingTemperatures(time);
  res.json({ time, buildings });
});

app.get('/api/history', (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Missing building id parameter' });
  }
  const history = getBuildingHistory(String(id));
  if (!history) {
    return res.status(404).json({ error: 'Building not found' });
  }
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`🚀 Heat Island API server running on http://localhost:${PORT}`);
  console.log(`   GET /api/temperature?time=14  - 获取指定时刻建筑温度`);
  console.log(`   GET /api/history?id={uuid}     - 获取建筑24小时温度历史`);
});
