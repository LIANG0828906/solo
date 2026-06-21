import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  getMolecule,
  getMoleculeList,
  handleEnergyCalculation,
  Molecule,
  EnergyResponse,
} from './moleculeData';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/molecules', (_req: Request, res: Response) => {
  try {
    const molecules = getMoleculeList();
    res.json(molecules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch molecule list' });
  }
});

app.get('/api/molecules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const molecule = getMolecule(id);

    if (!molecule) {
      res.status(404).json({ error: 'Molecule not found' });
      return;
    }

    res.json(molecule as Molecule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch molecule' });
  }
});

app.post('/api/calculate-energy', (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const result = handleEnergyCalculation(req.body);

    if ('error' in result) {
      res.status(404).json(result);
      return;
    }

    const responseTime = Date.now() - startTime;
    if (responseTime > 200) {
      console.warn(`Energy calculation took ${responseTime}ms, exceeding 200ms limit`);
    }

    res.json(result as EnergyResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate energy' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/molecules`);
  console.log(`  GET  /api/molecules/:id`);
  console.log(`  POST /api/calculate-energy`);
});
