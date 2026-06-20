import { Router, Request, Response } from 'express';
import { calculateValuation, getBrands, getModelsByBrand, getPriceTable } from '../services/valuationService.ts';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { brand, model, usageYears, condition } = req.body;

  if (!brand || !model) {
    res.status(400).json({ error: '品牌和型号为必填项' });
    return;
  }

  const years = Number(usageYears) || 0;
  const cond = Number(condition) || 5;

  const result = calculateValuation(String(brand), String(model), years, cond);

  res.json(result);
});

router.get('/brands', (_req: Request, res: Response) => {
  const brands = getBrands();
  res.json(brands);
});

router.get('/brands/:brand/models', (req: Request, res: Response) => {
  const models = getModelsByBrand(req.params.brand);
  res.json(models);
});

router.get('/price-table', (_req: Request, res: Response) => {
  const table = getPriceTable();
  res.json(table);
});

export default router;
