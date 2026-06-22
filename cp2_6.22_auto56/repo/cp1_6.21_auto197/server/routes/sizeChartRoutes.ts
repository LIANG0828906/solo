import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

export let sizeCharts = [
  {
    id: 'default-mens',
    brand: '标准男装',
    sizes: {
      S: { chest: 96, waist: 80, hip: 96, length: 68, shoulder: 44, sleeveLength: 60 },
      M: { chest: 100, waist: 84, hip: 100, length: 70, shoulder: 46, sleeveLength: 61 },
      L: { chest: 104, waist: 88, hip: 104, length: 72, shoulder: 48, sleeveLength: 62 },
      XL: { chest: 110, waist: 94, hip: 110, length: 74, shoulder: 50, sleeveLength: 63 },
      XXL: { chest: 116, waist: 100, hip: 116, length: 76, shoulder: 52, sleeveLength: 64 }
    }
  },
  {
    id: 'default-womens',
    brand: '标准女装',
    sizes: {
      S: { chest: 84, waist: 64, hip: 90, length: 62, shoulder: 38, sleeveLength: 56 },
      M: { chest: 88, waist: 68, hip: 94, length: 64, shoulder: 39, sleeveLength: 57 },
      L: { chest: 92, waist: 72, hip: 98, length: 66, shoulder: 40, sleeveLength: 58 },
      XL: { chest: 98, waist: 78, hip: 104, length: 68, shoulder: 42, sleeveLength: 59 },
      XXL: { chest: 104, waist: 84, hip: 110, length: 70, shoulder: 44, sleeveLength: 60 }
    }
  }
];

router.get('/', (_req: Request, res: Response) => {
  res.json(sizeCharts);
});

router.get('/:id', (req: Request, res: Response) => {
  const chart = sizeCharts.find(c => c.id === req.params.id);
  if (!chart) {
    return res.status(404).json({ error: 'Size chart not found' });
  }
  res.json(chart);
});

router.post('/', (req: Request, res: Response) => {
  const newChart = { id: uuidv4(), ...req.body };
  sizeCharts.push(newChart);
  res.status(201).json(newChart);
});

router.put('/:id', (req: Request, res: Response) => {
  const index = sizeCharts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Size chart not found' });
  }
  sizeCharts[index] = { ...sizeCharts[index], ...req.body, id: sizeCharts[index].id };
  res.json(sizeCharts[index]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const index = sizeCharts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Size chart not found' });
  }
  const deleted = sizeCharts.splice(index, 1)[0];
  res.json(deleted);
});

export default router;
