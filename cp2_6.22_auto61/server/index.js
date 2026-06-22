const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

const configs = [];
const reports = [];

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/api/configs', (req, res) => {
  const { name, gridSize, initialCreatures, resourceDensity } = req.body;
  const config = {
    id: uuidv4(),
    name,
    gridSize,
    initialCreatures,
    resourceDensity,
    createdAt: new Date().toISOString()
  };
  configs.push(config);
  res.json({ success: true, id: config.id });
});

app.get('/api/configs', (req, res) => {
  res.json(configs);
});

app.post('/api/reports', (req, res) => {
  const { configId, timestamp, duration, populationHistory, energyHistory, finalPopulation, avgEnergy } = req.body;
  const report = {
    id: uuidv4(),
    configId,
    timestamp,
    duration,
    populationHistory,
    energyHistory,
    finalPopulation,
    avgEnergy
  };
  reports.push(report);
  res.json({ success: true, id: report.id });
});

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
