import express from 'express';
import { medicines } from '../data/medicines';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(medicines);
});

router.get('/:id', (req, res) => {
  const medicine = medicines.find(m => m.id === req.params.id);
  if (!medicine) {
    return res.status(404).json({ error: '药材未找到' });
  }
  res.json(medicine);
});

export default router;
