import express from 'express';
import { SensorSimulator } from './sensorSimulator.js';

export function createDataRoutes(simulator: SensorSimulator): express.Router {
  const router = express.Router();

  router.get('/snapshot', (req, res) => {
    const snapshot = simulator.getLatestSnapshot();
    res.json(snapshot);
  });

  router.get('/history', (req, res) => {
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;
    const seconds = req.query.seconds ? parseInt(req.query.seconds as string) : undefined;
    
    let history;
    if (seconds) {
      history = simulator.getHistoryLastSeconds(seconds);
    } else {
      history = simulator.getHistory(startTime, endTime);
    }
    
    res.json(history);
  });

  router.get('/sensors/config', (req, res) => {
    res.json(simulator.getAllSensorConfigs());
  });

  router.get('/sensors/config/:type', (req, res) => {
    const type = req.params.type as 'temperature' | 'vibration' | 'noise';
    const config = simulator.getSensorConfig(type);
    if (config) {
      res.json(config);
    } else {
      res.status(404).json({ error: 'Sensor type not found' });
    }
  });

  return router;
}
