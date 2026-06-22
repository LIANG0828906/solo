import { Router, type Request, type Response } from 'express';
import {
  getAllLeathers,
  createLeather,
  updateLeather,
  deleteLeather,
  getLeatherById,
} from '../repositories/leatherRepository.js';
import type { Leather } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const leathers = await getAllLeathers();
    res.status(200).json(leathers);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, thickness, area, remaining, receiveDate } = req.body as Partial<
      Omit<Leather, 'id'>
    >;

    if (
      name === undefined ||
      name === '' ||
      type === undefined ||
      type === '' ||
      thickness === undefined ||
      area === undefined ||
      remaining === undefined ||
      receiveDate === undefined ||
      receiveDate === ''
    ) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const newLeather = await createLeather({
      name,
      type,
      thickness: Number(thickness),
      area: Number(area),
      remaining: Number(remaining),
      receiveDate,
    });
    res.status(201).json(newLeather);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, type, thickness, area, remaining, receiveDate } = req.body as Partial<
      Omit<Leather, 'id'>
    >;

    if (
      name === undefined ||
      name === '' ||
      type === undefined ||
      type === '' ||
      thickness === undefined ||
      area === undefined ||
      remaining === undefined ||
      receiveDate === undefined ||
      receiveDate === ''
    ) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const existing = await getLeatherById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Leather not found' });
      return;
    }

    await updateLeather(id, {
      name,
      type,
      thickness: Number(thickness),
      area: Number(area),
      remaining: Number(remaining),
      receiveDate,
    });

    const updated = await getLeatherById(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deleteLeather(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

export default router;
