import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  Order,
  Participant,
  OrderItem,
  calculateSplit,
} from '../services/splitService';

const router = Router();

const orders = new Map<string, Order>();

const broadcastFns = new Map<string, Set<(data: string) => void>>();

export function registerBroadcast(
  orderId: string,
  fn: (data: string) => void
): () => void {
  if (!broadcastFns.has(orderId)) broadcastFns.set(orderId, new Set());
  broadcastFns.get(orderId)!.add(fn);
  return () => {
    broadcastFns.get(orderId)?.delete(fn);
  };
}

export function broadcast(orderId: string, event: string, data: any) {
  const fns = broadcastFns.get(orderId);
  if (fns) {
    const msg = JSON.stringify({ event, data });
    fns.forEach((fn) => fn(msg));
  }
}

export { orders };

const PARTICIPANT_COLORS = [
  '#FF7043',
  '#FFA726',
  '#66BB6A',
  '#42A5F5',
  '#AB47BC',
  '#EC407A',
  '#26C6DA',
  '#FFCA28',
];

const FOOD_EMOJIS = [
  '🍚',
  '🍜',
  '🥟',
  '🍕',
  '🍔',
  '🍣',
  '🥗',
  '🍲',
  '🍗',
  '🥩',
  '🥘',
  '🍱',
  '🍛',
  '🌮',
  '🥪',
  '🍰',
];

router.post('/', (req: Request, res: Response) => {
  const { name, maxAmount, participantName } = req.body;
  if (!name || !participantName) {
    res.status(400).json({ error: '拼单名称和创建者姓名必填' });
    return;
  }

  const orderId = uuidv4().slice(0, 8);
  const creatorId = uuidv4().slice(0, 8);
  const creator: Participant = {
    id: creatorId,
    name: participantName,
    color: PARTICIPANT_COLORS[0],
    paid: false,
  };

  const order: Order = {
    id: orderId,
    name,
    maxAmount: maxAmount || undefined,
    participants: [creator],
    items: [],
    createdAt: new Date().toISOString(),
  };

  orders.set(orderId, order);
  res.status(201).json({ order, currentParticipantId: creatorId });
});

router.get('/:id', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  res.json(order);
});

router.post('/:id/participants', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: '姓名必填' });
    return;
  }

  const pid = uuidv4().slice(0, 8);
  const colorIdx = order.participants.length % PARTICIPANT_COLORS.length;
  const participant: Participant = {
    id: pid,
    name,
    color: PARTICIPANT_COLORS[colorIdx],
    paid: false,
  };

  order.participants.push(participant);
  broadcast(req.params.id, 'participant_added', participant);
  res.status(201).json({ participant, currentParticipantId: pid });
});

router.post('/:id/items', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const { name, price, quantity, sharedBy, isSharedByAll, emoji } = req.body;
  if (!name || price == null || quantity == null) {
    res.status(400).json({ error: '菜品名称、单价和数量必填' });
    return;
  }

  const item: OrderItem = {
    id: uuidv4().slice(0, 8),
    name,
    price: Number(price),
    quantity: Number(quantity),
    sharedBy: sharedBy || [],
    isSharedByAll: !!isSharedByAll,
    emoji:
      emoji || FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
  };

  order.items.push(item);
  broadcast(req.params.id, 'item_added', item);
  res.status(201).json(item);
});

router.put('/:id/items/:itemId', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const item = order.items.find((i) => i.id === req.params.itemId);
  if (!item) {
    res.status(404).json({ error: '菜品不存在' });
    return;
  }

  const { sharedBy, isSharedByAll, name, price, quantity, emoji } = req.body;

  if (name != null) item.name = name;
  if (price != null) item.price = Number(price);
  if (quantity != null) item.quantity = Number(quantity);
  if (sharedBy != null) item.sharedBy = sharedBy;
  if (isSharedByAll != null) item.isSharedByAll = !!isSharedByAll;
  if (emoji != null) item.emoji = emoji;

  broadcast(req.params.id, 'item_updated', item);
  res.json(item);
});

router.delete('/:id/items/:itemId', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const idx = order.items.findIndex((i) => i.id === req.params.itemId);
  if (idx === -1) {
    res.status(404).json({ error: '菜品不存在' });
    return;
  }

  const removed = order.items.splice(idx, 1)[0];
  broadcast(req.params.id, 'item_removed', removed);
  res.json({ success: true });
});

router.put('/:id/participants/:pid/payment', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const participant = order.participants.find((p) => p.id === req.params.pid);
  if (!participant) {
    res.status(404).json({ error: '参与者不存在' });
    return;
  }

  participant.paid = req.body.paid ?? !participant.paid;
  broadcast(req.params.id, 'payment_updated', {
    participantId: participant.id,
    paid: participant.paid,
  });
  res.json(participant);
});

router.get('/:id/split', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const result = calculateSplit(order);
  res.json(result);
});

export { router as orderRouter };
