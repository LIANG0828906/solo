import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Guest, Relation, Table, GuestGroup, RelationType } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const initialGuests: Guest[] = [
  { id: uuidv4(), name: '张美丽', group: 'family' },
  { id: uuidv4(), name: '李建国', group: 'family' },
  { id: uuidv4(), name: '王小红', group: 'family' },
  { id: uuidv4(), name: '赵敏', group: 'colleague' },
  { id: uuidv4(), name: '孙强', group: 'colleague' },
  { id: uuidv4(), name: '周杰', group: 'colleague' },
  { id: uuidv4(), name: '吴芳', group: 'friend' },
  { id: uuidv4(), name: '郑华', group: 'friend' },
  { id: uuidv4(), name: '陈晨', group: 'friend' },
  { id: uuidv4(), name: '刘洋', group: 'friend' }
];

const initialRelations: Relation[] = [
  { id: uuidv4(), guest1Id: initialGuests[0].id, guest2Id: initialGuests[1].id, type: 'family' },
  { id: uuidv4(), guest1Id: initialGuests[6].id, guest2Id: initialGuests[7].id, type: 'couple' },
  { id: uuidv4(), guest1Id: initialGuests[3].id, guest2Id: initialGuests[5].id, type: 'enemy' }
];

const initialTables: Table[] = [
  { id: uuidv4(), number: 1, seats: Array(8).fill(null) },
  { id: uuidv4(), number: 2, seats: Array(8).fill(null) },
  { id: uuidv4(), number: 3, seats: Array(8).fill(null) },
  { id: uuidv4(), number: 4, seats: Array(8).fill(null) }
];

let guests: Guest[] = [...initialGuests];
let relations: Relation[] = [...initialRelations];
let tables: Table[] = JSON.parse(JSON.stringify(initialTables));

app.get('/api/guests', (_req, res) => {
  res.json(guests);
});

app.post('/api/guests', (req, res) => {
  const { name, group } = req.body as { name: string; group: GuestGroup };
  if (!name || !group) {
    return res.status(400).json({ error: '姓名和分组必填' });
  }
  const newGuest: Guest = { id: uuidv4(), name, group };
  guests.push(newGuest);
  res.json(newGuest);
});

app.put('/api/guests/:id', (req, res) => {
  const { id } = req.params;
  const { name, group } = req.body as { name?: string; group?: GuestGroup };
  const idx = guests.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: '宾客不存在' });
  if (name) guests[idx].name = name;
  if (group) guests[idx].group = group;
  res.json(guests[idx]);
});

app.delete('/api/guests/:id', (req, res) => {
  const { id } = req.params;
  guests = guests.filter(g => g.id !== id);
  relations = relations.filter(r => r.guest1Id !== id && r.guest2Id !== id);
  tables = tables.map(t => ({ ...t, seats: t.seats.map(s => s === id ? null : s) }));
  res.json({ success: true });
});

app.get('/api/relations', (_req, res) => {
  res.json(relations);
});

app.post('/api/relations', (req, res) => {
  const { guest1Id, guest2Id, type } = req.body as { guest1Id: string; guest2Id: string; type: RelationType };
  if (!guest1Id || !guest2Id || !type) {
    return res.status(400).json({ error: '参数不完整' });
  }
  if (guest1Id === guest2Id) {
    return res.status(400).json({ error: '不能与自己建立关系' });
  }
  const exists = relations.find(
    r => (r.guest1Id === guest1Id && r.guest2Id === guest2Id) ||
         (r.guest1Id === guest2Id && r.guest2Id === guest1Id)
  );
  if (exists) return res.status(400).json({ error: '关系已存在' });
  const newRel: Relation = { id: uuidv4(), guest1Id, guest2Id, type };
  relations.push(newRel);
  res.json(newRel);
});

app.delete('/api/relations/:id', (req, res) => {
  const { id } = req.params;
  relations = relations.filter(r => r.id !== id);
  res.json({ success: true });
});

app.get('/api/tables', (_req, res) => {
  res.json(tables);
});

app.put('/api/tables', (req, res) => {
  const newTables = req.body as Table[];
  if (!Array.isArray(newTables)) return res.status(400).json({ error: '参数错误' });
  tables = newTables;
  res.json(tables);
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
