import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import type { Family, StorageLocation, InventoryItem, ConsumptionRecord } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

interface DbData {
  families: Family[];
  locations: StorageLocation[];
  items: InventoryItem[];
  consumptionRecords: ConsumptionRecord[];
}

const defaultData: DbData = {
  families: [],
  locations: [],
  items: [],
  consumptionRecords: [],
};

const db = await JSONFilePreset<DbData>('db.json', defaultData);

function addConsumptionRecord(
  type: 'added' | 'consumed',
  itemId: string,
  itemName: string,
  familyId: string,
  storageLocationId: string,
  quantity: number
) {
  const record: ConsumptionRecord = {
    id: uuidv4(),
    itemId,
    itemName,
    familyId,
    storageLocationId,
    type,
    quantity,
    date: moment().format('YYYY-MM-DD'),
  };
  db.data.consumptionRecords.push(record);
}

app.get('/api/families', (_req, res) => {
  res.json(db.data.families);
});

app.post('/api/families', async (req, res) => {
  const family: Family = {
    id: uuidv4(),
    name: req.body.name || '',
    location: req.body.location || '',
  };
  db.data.families.push(family);
  await db.write();
  res.json(family);
});

app.put('/api/families/:id', async (req, res) => {
  const idx = db.data.families.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Family not found' });
  db.data.families[idx] = { ...db.data.families[idx], ...req.body };
  await db.write();
  res.json(db.data.families[idx]);
});

app.delete('/api/families/:id', async (req, res) => {
  const id = req.params.id;
  db.data.families = db.data.families.filter((f) => f.id !== id);
  db.data.locations = db.data.locations.filter((l) => l.familyId !== id);
  db.data.items = db.data.items.filter((i) => i.familyId !== id);
  db.data.consumptionRecords = db.data.consumptionRecords.filter((r) => r.familyId !== id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/families/:familyId/locations', (req, res) => {
  const locs = db.data.locations.filter((l) => l.familyId === req.params.familyId);
  res.json(locs);
});

app.post('/api/families/:familyId/locations', async (req, res) => {
  const loc: StorageLocation = {
    id: uuidv4(),
    name: req.body.name || '',
    color: req.body.color || '#4caf50',
    familyId: req.params.familyId,
  };
  db.data.locations.push(loc);
  await db.write();
  res.json(loc);
});

app.put('/api/families/:familyId/locations/:id', async (req, res) => {
  const idx = db.data.locations.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Location not found' });
  db.data.locations[idx] = { ...db.data.locations[idx], ...req.body };
  await db.write();
  res.json(db.data.locations[idx]);
});

app.delete('/api/families/:familyId/locations/:id', async (req, res) => {
  const id = req.params.id;
  db.data.locations = db.data.locations.filter((l) => l.id !== id);
  db.data.items = db.data.items.filter((i) => i.storageLocationId === id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/families/:familyId/items', (req, res) => {
  let items = db.data.items.filter((i) => i.familyId === req.params.familyId);
  const { locationId, status } = req.query;
  if (locationId) {
    items = items.filter((i) => i.storageLocationId === locationId);
  }
  if (status) {
    const now = moment();
    if (status === 'expired') {
      items = items.filter((i) => moment(i.expiryDate).isBefore(now, 'day'));
    } else if (status === 'expiring') {
      items = items.filter(
        (i) =>
          moment(i.expiryDate).diff(now, 'days') >= 0 &&
          moment(i.expiryDate).diff(now, 'days') <= 3
      );
    } else if (status === 'lowstock') {
      items = items.filter((i) => i.quantity < i.minThreshold);
    }
  }
  res.json(items);
});

app.post('/api/families/:familyId/items', async (req, res) => {
  const item: InventoryItem = {
    id: uuidv4(),
    name: req.body.name,
    quantity: req.body.quantity,
    unit: req.body.unit,
    purchaseDate: req.body.purchaseDate,
    expiryDate: req.body.expiryDate,
    storageLocationId: req.body.storageLocationId,
    familyId: req.params.familyId,
    minThreshold: req.body.minThreshold ?? 1,
    processed: false,
  };
  db.data.items.push(item);
  addConsumptionRecord('added', item.id, item.name, item.familyId, item.storageLocationId, item.quantity);
  await db.write();
  res.json(item);
});

app.put('/api/families/:familyId/items/:id', async (req, res) => {
  const idx = db.data.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const oldItem = db.data.items[idx];
  db.data.items[idx] = { ...oldItem, ...req.body };
  if (req.body.quantity !== undefined && req.body.quantity !== oldItem.quantity) {
    const diff = req.body.quantity - oldItem.quantity;
    if (diff > 0) {
      addConsumptionRecord('added', oldItem.id, oldItem.name, oldItem.familyId, oldItem.storageLocationId, diff);
    } else if (diff < 0) {
      addConsumptionRecord('consumed', oldItem.id, oldItem.name, oldItem.familyId, oldItem.storageLocationId, Math.abs(diff));
    }
  }
  await db.write();
  res.json(db.data.items[idx]);
});

app.delete('/api/families/:familyId/items/:id', async (req, res) => {
  const idx = db.data.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const item = db.data.items[idx];
  addConsumptionRecord('consumed', item.id, item.name, item.familyId, item.storageLocationId, item.quantity);
  db.data.items = db.data.items.filter((i) => i.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/families/:familyId/expiring', (req, res) => {
  const now = moment();
  const items = db.data.items.filter((i) => {
    if (i.familyId !== req.params.familyId) return false;
    const days = moment(i.expiryDate).diff(now, 'days');
    return days >= 0 && days <= 3;
  });
  res.json(items);
});

app.get('/api/families/:familyId/suggestions', (req, res) => {
  const familyId = req.params.familyId;
  const now = moment();
  const suggestions: Array<{
    itemId: string;
    itemName: string;
    currentQuantity: number;
    suggestedQuantity: number;
    reason: string;
    storageLocationId: string;
    unit: string;
  }> = [];

  db.data.items
    .filter((i) => i.familyId === familyId)
    .forEach((item) => {
      const daysToExpiry = moment(item.expiryDate).diff(now, 'days');

      if (item.quantity < item.minThreshold) {
        const safetyMargin = Math.max(1, Math.ceil(item.minThreshold * 0.2));
        suggestions.push({
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.quantity,
          suggestedQuantity: item.minThreshold - item.quantity + safetyMargin,
          reason: `库存不足：当前 ${item.quantity}${item.unit}，阈值 ${item.minThreshold}${item.unit}`,
          storageLocationId: item.storageLocationId,
          unit: item.unit,
        });
      }

      if ((daysToExpiry <= 5 || daysToExpiry < 0) && !item.processed) {
        const safetyMargin = Math.max(1, Math.ceil(item.minThreshold * 0.2));
        const existing = suggestions.find((s) => s.itemId === item.id);
        if (existing) {
          existing.reason += `；${daysToExpiry < 0 ? '已过期' : `${daysToExpiry}天后过期`}，建议补货`;
        } else {
          suggestions.push({
            itemId: item.id,
            itemName: item.name,
            currentQuantity: item.quantity,
            suggestedQuantity: item.minThreshold + safetyMargin,
            reason: daysToExpiry < 0 ? '已过期，需要补货' : `${daysToExpiry}天后即将过期，建议提前补货`,
            storageLocationId: item.storageLocationId,
            unit: item.unit,
          });
        }
      }
    });

  res.json(suggestions);
});

app.post('/api/families/:familyId/suggestions/:itemId/purchase', async (req, res) => {
  const { familyId, itemId } = req.params;
  const quantity = req.body.quantity || 0;
  const idx = db.data.items.findIndex((i) => i.id === itemId && i.familyId === familyId);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  db.data.items[idx].quantity += quantity;
  db.data.items[idx].processed = true;
  addConsumptionRecord(
    'added',
    db.data.items[idx].id,
    db.data.items[idx].name,
    db.data.items[idx].familyId,
    db.data.items[idx].storageLocationId,
    quantity
  );
  await db.write();
  res.json(db.data.items[idx]);
});

app.get('/api/families/:familyId/consumption', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const since = moment().subtract(days, 'days').format('YYYY-MM-DD');
  const records = db.data.consumptionRecords.filter(
    (r) => r.familyId === req.params.familyId && r.date >= since
  );
  res.json(records);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
