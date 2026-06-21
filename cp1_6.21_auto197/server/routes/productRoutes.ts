import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sizeCharts } from './sizeChartRoutes';

const router = Router();

let products: any[] = [];

router.get('/', (_req: Request, res: Response) => {
  res.json(products);
});

router.get('/:id', (req: Request, res: Response) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

router.post('/', (req: Request, res: Response) => {
  const newProduct = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

router.post('/recommend', (req: Request, res: Response) => {
  const { measurements, chartId } = req.body;

  const chart = sizeCharts.find((c: any) => c.id === (chartId || 'default-mens'));
  if (!chart) {
    return res.status(404).json({ error: 'Size chart not found' });
  }

  const allScores: Record<string, number> = {};
  let recommendedSize = '';
  let highestScore = -1;

  for (const [sizeLabel, sizeValues] of Object.entries(chart.sizes)) {
    const dims = sizeValues as Record<string, number>;
    const ratios: number[] = [];

    for (const [dim, sizeVal] of Object.entries(dims)) {
      const userVal = measurements[dim];
      if (userVal !== undefined && sizeVal !== 0) {
        ratios.push(Math.abs(userVal - sizeVal) / sizeVal);
      }
    }

    const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
    const fitScore = Math.round(Math.max(0, (1 - avgRatio * 2)) * 100 * 100) / 100;

    allScores[sizeLabel] = fitScore;

    if (fitScore > highestScore) {
      highestScore = fitScore;
      recommendedSize = sizeLabel;
    }
  }

  res.json({
    recommendedSize,
    fitScore: highestScore,
    allScores,
    chartId: chart.id,
    chartBrand: chart.brand
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const deleted = products.splice(index, 1)[0];
  res.json(deleted);
});

export default router;
