import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

interface TourEvent {
  id: string;
  date: string;
  bandName: string;
  city: string;
  venue: string;
  expectedTickets: number;
  ticketPrice: number;
}

interface EquipmentOrder {
  id: string;
  tourEventId: string;
  equipmentName: string;
  days: number;
  unitPrice: number;
}

let tourEvents: TourEvent[] = [];
let equipmentOrders: EquipmentOrder[] = [];
let tourIdCounter = 1;
let orderIdCounter = 1;

const BAND_COLORS: Record<string, string> = {};

function getBandColor(bandName: string): string {
  if (!BAND_COLORS[bandName]) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const idx = Object.keys(BAND_COLORS).length % colors.length;
    BAND_COLORS[bandName] = colors[idx];
  }
  return BAND_COLORS[bandName];
}

app.get('/api/tours', (_req, res) => {
  res.json(tourEvents.map(t => ({ ...t, color: getBandColor(t.bandName) })));
});

app.post('/api/tours', (req, res) => {
  const { date, bandName, city, venue, expectedTickets, ticketPrice } = req.body;
  if (!date || !bandName || !city || !venue || expectedTickets == null || ticketPrice == null) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const conflict = tourEvents.find(t => t.date === date && t.bandName === bandName);
  if (conflict) {
    res.status(409).json({
      error: '冲突',
      message: `乐队"${bandName}"在${date}已有巡演事件`,
      existingEvent: conflict,
    });
    return;
  }
  const newEvent: TourEvent = {
    id: String(tourIdCounter++),
    date,
    bandName,
    city,
    venue,
    expectedTickets: Number(expectedTickets),
    ticketPrice: Number(ticketPrice),
  };
  tourEvents.push(newEvent);
  res.status(201).json({ ...newEvent, color: getBandColor(newEvent.bandName) });
});

app.put('/api/tours/:id', (req, res) => {
  const { id } = req.params;
  const idx = tourEvents.findIndex(t => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: '巡演事件未找到' });
    return;
  }
  const { date, bandName, city, venue, expectedTickets, ticketPrice } = req.body;
  if (date && bandName) {
    const conflict = tourEvents.find(t => t.id !== id && t.date === date && t.bandName === bandName);
    if (conflict) {
      res.status(409).json({
        error: '冲突',
        message: `乐队"${bandName}"在${date}已有巡演事件`,
        existingEvent: conflict,
      });
      return;
    }
  }
  tourEvents[idx] = {
    ...tourEvents[idx],
    ...(date && { date }),
    ...(bandName && { bandName }),
    ...(city && { city }),
    ...(venue && { venue }),
    ...(expectedTickets != null && { expectedTickets: Number(expectedTickets) }),
    ...(ticketPrice != null && { ticketPrice: Number(ticketPrice) }),
  };
  res.json({ ...tourEvents[idx], color: getBandColor(tourEvents[idx].bandName) });
});

app.delete('/api/tours/:id', (req, res) => {
  const { id } = req.params;
  const idx = tourEvents.findIndex(t => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: '巡演事件未找到' });
    return;
  }
  tourEvents.splice(idx, 1);
  equipmentOrders = equipmentOrders.filter(o => o.tourEventId !== id);
  res.json({ success: true });
});

app.get('/api/equipment', (req, res) => {
  const { tourEventId } = req.query;
  let filtered = equipmentOrders;
  if (tourEventId) {
    filtered = filtered.filter(o => o.tourEventId === tourEventId);
  }
  res.json(filtered);
});

app.post('/api/equipment', (req, res) => {
  const { tourEventId, equipmentName, days, unitPrice } = req.body;
  if (!tourEventId || !equipmentName || days == null || unitPrice == null) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const tourExists = tourEvents.find(t => t.id === tourEventId);
  if (!tourExists) {
    res.status(404).json({ error: '关联巡演事件未找到' });
    return;
  }
  const newOrder: EquipmentOrder = {
    id: String(orderIdCounter++),
    tourEventId,
    equipmentName: equipmentName.substring(0, 20),
    days: Math.min(14, Math.max(1, Number(days))),
    unitPrice: Number(unitPrice),
  };
  equipmentOrders.push(newOrder);
  res.status(201).json(newOrder);
});

app.delete('/api/equipment/:id', (req, res) => {
  const { id } = req.params;
  const idx = equipmentOrders.findIndex(o => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: '设备订单未找到' });
    return;
  }
  equipmentOrders.splice(idx, 1);
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
