import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { BattleTemplate, FleetConfig, SimulationResult, GameStateFrame } from '../shared/types';
import { BattleEngine } from './battleEngine';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const templates = new Map<string, BattleTemplate>();
const simulations = new Map<string, { engine: BattleEngine; config: { blueFleet: FleetConfig; redFleet: FleetConfig } }>();
const results = new Map<string, SimulationResult>();

app.get('/api/templates', (req: Request, res: Response<BattleTemplate[]>) => {
  try {
    res.json(Array.from(templates.values()));
  } catch (error) {
    res.status(500).json([]);
  }
});

app.post('/api/templates', (req: Request<{}, BattleTemplate, { name: string; blueFleet: FleetConfig; redFleet: FleetConfig }>, res: Response<BattleTemplate>) => {
  try {
    const { name, blueFleet, redFleet } = req.body;
    if (!name || !blueFleet || !redFleet) {
      res.status(400).json({} as BattleTemplate);
      return;
    }
    const template: BattleTemplate = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
      blueFleet,
      redFleet,
    };
    templates.set(template.id, template);
    res.json(template);
  } catch (error) {
    res.status(500).json({} as BattleTemplate);
  }
});

app.get('/api/templates/:id', (req: Request<{ id: string }>, res: Response<BattleTemplate>) => {
  try {
    const template = templates.get(req.params.id);
    if (!template) {
      res.status(404).json({} as BattleTemplate);
      return;
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({} as BattleTemplate);
  }
});

app.delete('/api/templates/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean }>) => {
  try {
    const deleted = templates.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/simulation/start', (req: Request<{}, { simulationId: string }, { blueFleet: FleetConfig; redFleet: FleetConfig }>, res: Response<{ simulationId: string }>) => {
  try {
    const { blueFleet, redFleet } = req.body;
    if (!blueFleet || !redFleet) {
      res.status(400).json({ simulationId: '' });
      return;
    }
    const engine = new BattleEngine({ blueFleet, redFleet });
    const simulationId = uuidv4();
    simulations.set(simulationId, { engine, config: { blueFleet, redFleet } });
    engine.start();
    res.json({ simulationId });
  } catch (error) {
    res.status(500).json({ simulationId: '' });
  }
});

app.get('/api/simulation/:id/frame', (req: Request<{ id: string }>, res: Response<GameStateFrame>) => {
  try {
    const sim = simulations.get(req.params.id);
    if (!sim) {
      res.status(404).json({} as GameStateFrame);
      return;
    }
    res.json(sim.engine.getCurrentFrame());
  } catch (error) {
    res.status(500).json({} as GameStateFrame);
  }
});

app.post('/api/simulation/:id/pause', (req: Request<{ id: string }>, res: Response<{ paused: boolean }>) => {
  try {
    const sim = simulations.get(req.params.id);
    if (!sim) {
      res.status(404).json({ paused: false });
      return;
    }
    sim.engine.pause();
    res.json({ paused: true });
  } catch (error) {
    res.status(500).json({ paused: false });
  }
});

app.post('/api/simulation/:id/resume', (req: Request<{ id: string }>, res: Response<{ paused: boolean }>) => {
  try {
    const sim = simulations.get(req.params.id);
    if (!sim) {
      res.status(404).json({ paused: true });
      return;
    }
    sim.engine.resume();
    res.json({ paused: false });
  } catch (error) {
    res.status(500).json({ paused: true });
  }
});

app.post('/api/simulation/:id/stop', (req: Request<{ id: string }>, res: Response<SimulationResult>) => {
  try {
    const sim = simulations.get(req.params.id);
    if (!sim) {
      res.status(404).json({} as SimulationResult);
      return;
    }
    const result = sim.engine.stop();
    results.set(req.params.id, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({} as SimulationResult);
  }
});

app.get('/api/simulation/:id/result', (req: Request<{ id: string }>, res: Response<SimulationResult>) => {
  try {
    const result = results.get(req.params.id);
    if (!result) {
      res.status(404).json({} as SimulationResult);
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({} as SimulationResult);
  }
});

app.delete('/api/simulation/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean }>) => {
  try {
    const sim = simulations.get(req.params.id);
    if (sim) {
      sim.engine.stop();
    }
    const deletedSim = simulations.delete(req.params.id);
    const deletedResult = results.delete(req.params.id);
    if (!deletedSim && !deletedResult) {
      res.status(404).json({ success: false });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
