import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;
const GRID_SIZE = 10;

const BLOCK_NAMES = [
  '朝阳', '望京', '国贸', '中关村', '金融街', '三里屯', '王府井', '西单',
  '东单', '北三环', '南锣鼓巷', '什刹海', '奥体', '五道口', '上地', '回龙观',
  '天通苑', '亦庄', '通州', '大兴', '石景山', '门头沟', '房山', '昌平',
  '顺义', '怀柔', '密云', '平谷', '延庆', '海淀'
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateBlockName() {
  const prefix = BLOCK_NAMES[Math.floor(Math.random() * BLOCK_NAMES.length)];
  const suffix = Math.floor(Math.random() * 100);
  return `${prefix}${suffix}号街区`;
}

function generateBlocks() {
  const blocks = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      blocks.push({
        id: uuidv4(),
        name: generateBlockName(),
        x,
        z,
        height: randomBetween(0.5, 3),
        greenRate: randomBetween(0.1, 0.6),
        buildingDensity: randomBetween(0.3, 0.9),
        baseHeat: randomBetween(0.2, 0.5),
      });
    }
  }
  return blocks;
}

const blocksData = generateBlocks();

let solarIntensity = 50;
let globalGreenRate = 30;
let globalBuildingDensity = 60;

function calculateHeatValue(block, hour) {
  const timeFactor = Math.max(0, Math.sin(((hour - 6) / 24) * Math.PI * 2));
  const solarFactor = (solarIntensity / 100) * 0.5;
  const densityFactor = (block.buildingDensity * (globalBuildingDensity / 100)) * 0.3;
  const greenFactor = (block.greenRate * (globalGreenRate / 100)) * 0.25;
  const heat = block.baseHeat + timeFactor * (solarFactor + densityFactor - greenFactor);
  return Math.max(0, Math.min(1, heat));
}

function getCurrentHour() {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  return (totalMinutes % 1440) / 60;
}

app.get('/api/blocks', (req, res) => {
  const hour = getCurrentHour();
  const blocks = blocksData.map(block => ({
    ...block,
    heatValue: calculateHeatValue(block, hour),
    temperature: 20 + calculateHeatValue(block, hour) * 20,
  }));
  res.json(blocks);
});

app.post('/api/params', (req, res) => {
  const { solarIntensity: si, greenRate: gr, buildingDensity: bd } = req.body;
  if (si !== undefined) solarIntensity = Math.max(0, Math.min(100, si));
  if (gr !== undefined) globalGreenRate = Math.max(0, Math.min(100, gr));
  if (bd !== undefined) globalBuildingDensity = Math.max(0, Math.min(100, bd));
  res.json({ solarIntensity, globalGreenRate, globalBuildingDensity });
});

app.get('/api/thermal/history', (req, res) => {
  const blockIds = req.query.blockIds ? req.query.blockIds.split(',') : null;
  const filteredBlocks = blockIds
    ? blocksData.filter(b => blockIds.includes(b.id))
    : blocksData;

  const hours = [];
  const values = [];
  for (let h = 0; h < 24; h++) {
    hours.push(`${h}:00`);
    const avgHeat = filteredBlocks.reduce((sum, block) => {
      return sum + calculateHeatValue(block, h);
    }, 0) / filteredBlocks.length;
    values.push(20 + avgHeat * 20);
  }

  res.json({
    labels: hours,
    values,
    blocks: filteredBlocks.map(b => ({ id: b.id, name: b.name })),
  });
});

app.get('/api/block/:id/history', (req, res) => {
  const block = blocksData.find(b => b.id === req.params.id);
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }

  const history = [];
  for (let h = 0; h < 24; h++) {
    const heat = calculateHeatValue(block, h);
    history.push({
      hour: h,
      time: `${h}:00`,
      heatValue: heat,
      temperature: 20 + heat * 20,
    });
  }

  res.json({
    block: {
      id: block.id,
      name: block.name,
      greenRate: block.greenRate,
      buildingDensity: block.buildingDensity,
      currentTemperature: 20 + calculateHeatValue(block, getCurrentHour()) * 20,
    },
    history,
  });
});

app.get('/api/thermal/current', (req, res) => {
  const hour = getCurrentHour();
  const heats = blocksData.map(b => calculateHeatValue(b, hour));
  const avgHeat = heats.reduce((a, b) => a + b, 0) / heats.length;
  const maxHeat = Math.max(...heats);
  res.json({
    hour,
    averageHeat: avgHeat,
    maxHeat: maxHeat,
    averageTemperature: 20 + avgHeat * 20,
    maxTemperature: 20 + maxHeat * 20,
    solarIntensity,
    globalGreenRate,
    globalBuildingDensity,
  });
});

app.listen(PORT, () => {
  console.log(`Thermal API server running on http://localhost:${PORT}`);
});
