import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Guest, Table, validateSeating } from './rules/seatRules';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let guests: Guest[] = [
  { id: uuidv4(), name: '张新娘', relationships: [] },
  { id: uuidv4(), name: '李新郎', relationships: [] },
  { id: uuidv4(), name: '王爸爸', relationships: [] },
  { id: uuidv4(), name: '赵妈妈', relationships: [] },
  { id: uuidv4(), name: '张小明', relationships: [] },
  { id: uuidv4(), name: '李小红', relationships: [] },
  { id: uuidv4(), name: '陈经理', relationships: [] },
  { id: uuidv4(), name: '刘同事', relationships: [] },
  { id: uuidv4(), name: '周朋友', relationships: [] },
  { id: uuidv4(), name: '吴朋友', relationships: [] },
];

guests[0].relationships = [
  { guestId: guests[1].id, type: 'couple' },
  { guestId: guests[2].id, type: 'family' },
  { guestId: guests[3].id, type: 'family' },
  { guestId: guests[4].id, type: 'family' },
];

guests[1].relationships = [
  { guestId: guests[0].id, type: 'couple' },
  { guestId: guests[5].id, type: 'family' },
  { guestId: guests[6].id, type: 'colleague' },
];

guests[2].relationships = [
  { guestId: guests[0].id, type: 'family' },
  { guestId: guests[3].id, type: 'couple' },
  { guestId: guests[4].id, type: 'family' },
];

guests[3].relationships = [
  { guestId: guests[0].id, type: 'family' },
  { guestId: guests[2].id, type: 'couple' },
  { guestId: guests[4].id, type: 'family' },
];

guests[4].relationships = [
  { guestId: guests[0].id, type: 'family' },
  { guestId: guests[2].id, type: 'family' },
  { guestId: guests[3].id, type: 'family' },
  { guestId: guests[9].id, type: 'enemy' },
];

guests[5].relationships = [
  { guestId: guests[1].id, type: 'family' },
  { guestId: guests[8].id, type: 'friend' },
];

guests[6].relationships = [
  { guestId: guests[1].id, type: 'colleague' },
  { guestId: guests[7].id, type: 'colleague' },
];

guests[7].relationships = [
  { guestId: guests[6].id, type: 'colleague' },
];

guests[8].relationships = [
  { guestId: guests[5].id, type: 'friend' },
  { guestId: guests[9].id, type: 'friend' },
];

guests[9].relationships = [
  { guestId: guests[8].id, type: 'friend' },
  { guestId: guests[4].id, type: 'enemy' },
];

let tables: Table[] = [];

function initializeTables() {
  tables = [];
  for (let i = 1; i <= 6; i++) {
    tables.push({
      id: uuidv4(),
      tableNumber: i,
      seats: Array(8).fill(null),
    });
  }
}

initializeTables();

app.get('/api/guests', (req, res) => {
  res.json(guests);
});

app.post('/api/guests', (req, res) => {
  const { name, relationships } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '姓名不能为空' });
  }

  const newGuest: Guest = {
    id: uuidv4(),
    name,
    relationships: relationships || [],
  };

  guests.push(newGuest);
  res.status(201).json(newGuest);
});

app.get('/api/tables', (req, res) => {
  res.json(tables);
});

app.post('/api/assign', (req, res) => {
  const { guestId, tableId, seatIndex } = req.body;

  if (!guestId || !tableId || seatIndex === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const table = tables.find(t => t.id === tableId);
  if (!table) {
    return res.status(404).json({ error: '桌子不存在' });
  }

  const guest = guests.find(g => g.id === guestId);
  if (!guest) {
    return res.status(404).json({ error: '宾客不存在' });
  }

  tables.forEach(t => {
    t.seats = t.seats.map(s => s === guestId ? null : s);
  });

  table.seats[seatIndex] = guestId;

  const validation = validateSeating(tables, guests);

  res.json({
    tables,
    ...validation,
  });
});

app.post('/api/unassign', (req, res) => {
  const { guestId } = req.body;

  if (!guestId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  tables.forEach(t => {
    t.seats = t.seats.map(s => s === guestId ? null : s);
  });

  const validation = validateSeating(tables, guests);

  res.json({
    tables,
    ...validation,
  });
});

app.post('/api/validate', (req, res) => {
  const validation = validateSeating(tables, guests);
  res.json(validation);
});

app.post('/api/tables/reset', (req, res) => {
  initializeTables();
  res.json(tables);
});

app.listen(PORT, () => {
  console.log(`婚礼座位安排服务运行在 http://localhost:${PORT}`);
});
