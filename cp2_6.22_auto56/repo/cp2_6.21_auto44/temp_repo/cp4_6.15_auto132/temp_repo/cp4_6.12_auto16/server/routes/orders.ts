import { Router, Request, Response } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  addTuningRecord,
  getTuningRecords,
  getProgressHistory,
  OrderInput,
} from '../db';

const router = Router();

router.post('/orders', (req: Request, res: Response) => {
  try {
    const input = req.body as OrderInput;
    if (
      !input.instrumentType ||
      !input.instrumentName ||
      !input.topWoodId ||
      !input.backWoodId ||
      !input.sideWoodId ||
      !input.fingerboardWoodId ||
      !input.neckWoodId ||
      !input.customerName ||
      !input.customerEmail ||
      !input.customerPhone
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const orderId = createOrder(input);
    res.status(201).json({ id: orderId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/orders', (_req: Request, res: Response) => {
  try {
    const orders = getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = getOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.get('/orders/:id/progress', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const history = getProgressHistory(id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress history' });
  }
});

router.put('/orders/:id/status', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body as { status: number };
    if (typeof status !== 'number' || status < 0 || status > 7) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }
    updateOrderStatus(id, status);
    const order = getOrderById(id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.post('/orders/:id/tuning', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { tuningDate, pitch, notes } = req.body as {
      tuningDate: string;
      pitch: number;
      notes: string;
    };
    if (!tuningDate || !pitch) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const recordId = addTuningRecord(id, tuningDate, pitch, notes || '');
    res.status(201).json({ id: recordId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add tuning record' });
  }
});

router.get('/orders/:id/tuning', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const records = getTuningRecords(id);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tuning records' });
  }
});

export default router;
