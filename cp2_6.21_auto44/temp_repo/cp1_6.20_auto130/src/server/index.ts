import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
} from './configStore';
import { CityParams } from '../modules/BuildingGenerator';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/configs', (_req, res) => {
  try {
    const configs = getAllConfigs();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

app.get('/api/configs/:id', (req, res) => {
  try {
    const config = getConfigById(req.params.id);
    if (!config) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.post('/api/configs', (req, res) => {
  try {
    const { name, params }: { name: string; params: CityParams } = req.body;
    if (!name || !params) {
      res.status(400).json({ error: 'Name and params are required' });
      return;
    }
    const newConfig = createConfig(name, params);
    res.status(201).json(newConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create config' });
  }
});

app.put('/api/configs/:id', (req, res) => {
  try {
    const { name, params }: { name: string; params: CityParams } = req.body;
    const updated = updateConfig(req.params.id, name, params);
    if (!updated) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

app.delete('/api/configs/:id', (req, res) => {
  try {
    const deleted = deleteConfig(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
