import express from 'express';
import cors from 'cors';
import { calculateStress } from './stressCalculator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/calculateStress', (req, res) => {
  try {
    const { wallType, windPressure, windDirection } = req.body;

    if (!wallType || windPressure === undefined || windDirection === undefined) {
      res.status(400).json({ error: 'Missing required parameters: wallType, windPressure, windDirection' });
      return;
    }

    const validTypes = ['point-supported', 'frame-supported', 'unit-type'];
    if (!validTypes.includes(wallType)) {
      res.status(400).json({ error: 'Invalid wallType. Must be one of: point-supported, frame-supported, unit-type' });
      return;
    }

    if (typeof windPressure !== 'number' || windPressure < 0 || windPressure > 8) {
      res.status(400).json({ error: 'windPressure must be a number between 0 and 8' });
      return;
    }

    if (typeof windDirection !== 'number' || windDirection < 0 || windDirection > 360) {
      res.status(400).json({ error: 'windDirection must be a number between 0 and 360' });
      return;
    }

    const result = calculateStress({ wallType, windPressure, windDirection });
    res.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Internal calculation error' });
  }
});

app.listen(PORT, () => {
  console.log(`Stress calculation server running on port ${PORT}`);
});
