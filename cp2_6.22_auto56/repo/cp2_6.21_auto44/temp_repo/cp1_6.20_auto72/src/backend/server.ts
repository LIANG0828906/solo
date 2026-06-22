import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;
const DATA_PATH = path.join(__dirname, 'data', 'okrData.json');

app.use(cors());
app.use(bodyParser.json());

const readData = () => {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/api/cycles', (req, res) => {
  const data = readData();
  res.json(data.cycles);
});

app.get('/api/cycles/:id', (req, res) => {
  const data = readData();
  const cycle = data.cycles.find((c: any) => c.id === req.params.id);
  if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
  res.json(cycle);
});

app.get('/api/cycles/:cycleId/objectives', (req, res) => {
  const data = readData();
  const cycle = data.cycles.find((c: any) => c.id === req.params.cycleId);
  if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
  res.json(cycle.objectives);
});

app.put('/api/cycles/:cycleId/objectives/:objectiveId/keyresults/:krId', (req, res) => {
  const data = readData();
  const cycle = data.cycles.find((c: any) => c.id === req.params.cycleId);
  if (!cycle) return res.status(404).json({ error: 'Cycle not found' });

  const objective = cycle.objectives.find((o: any) => o.id === req.params.objectiveId);
  if (!objective) return res.status(404).json({ error: 'Objective not found' });

  const kr = objective.keyResults.find((k: any) => k.id === req.params.krId);
  if (!kr) return res.status(404).json({ error: 'Key Result not found' });

  kr.currentValue = req.body.currentValue;
  writeData(data);
  res.json(kr);
});

app.get('/api/members', (req, res) => {
  const data = readData();
  res.json(data.members);
});

app.get('/api/current-member', (req, res) => {
  const data = readData();
  res.json({ name: data.currentMember });
});

app.get('/api/historical', (req, res) => {
  const data = readData();
  res.json(data.historicalData);
});

app.get('/api/members/:name/keyresults', (req, res) => {
  const data = readData();
  const memberName = decodeURIComponent(req.params.name);
  const results: any[] = [];

  data.cycles.forEach((cycle: any) => {
    cycle.objectives.forEach((obj: any) => {
      if (obj.owner === memberName) {
        obj.keyResults.forEach((kr: any) => {
          results.push({
            ...kr,
            objectiveId: obj.id,
            objectiveName: obj.name,
            cycleId: cycle.id,
            cycleName: cycle.name,
            owner: obj.owner
          });
        });
      }
    });
  });

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`OKR Server running on http://localhost:${PORT}`);
});
