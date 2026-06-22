import { Router } from 'express';
import { getCollection, createItem, updateItem, deleteItem, findUserById } from '../db.js';

const router = Router();
const HOUSE_ID = 'house-1';

router.get('/house', async (req, res) => {
  const houses = await getCollection('houses');
  const house = houses.find((h) => h.id === HOUSE_ID);
  if (!house) return res.status(404).json({ error: '未找到房源' });

  const members = [];
  for (const mid of house.memberIds) {
    const u = await findUserById(mid);
    if (u) members.push({ id: u.id, nickname: u.nickname, avatar: u.avatar });
  }
  res.json({ id: house.id, address: house.address, totalRent: house.totalRent, members });
});

router.post('/rent/split', async (req, res) => {
  const { totalRent, ratios } = req.body;
  const result = ratios.map((r) => ({
    userId: r.userId,
    amount: Math.round((totalRent * r.ratio) / 100),
  }));
  setTimeout(() => res.json(result), 60);
});

router.get('/duty', async (req, res) => {
  const duties = await getCollection('duties');
  const houseDuties = duties.filter((d) => d.houseId === HOUSE_ID);
  const enriched = await Promise.all(
    houseDuties.map(async (d) => {
      const u = await findUserById(d.userId);
      return { ...d, user: u ? { id: u.id, nickname: u.nickname, avatar: u.avatar } : null };
    })
  );
  res.json(enriched);
});

router.put('/duty/:id', async (req, res) => {
  const { userId } = req.body;
  const updated = await updateItem('duties', req.params.id, { userId });
  if (!updated) return res.status(404).json({ error: '值日记录不存在' });
  const u = await findUserById(updated.userId);
  res.json({ ...updated, user: u ? { id: u.id, nickname: u.nickname, avatar: u.avatar } : null });
});

router.get('/grocery', async (req, res) => {
  const items = await getCollection('groceries');
  res.json(items.filter((g) => g.houseId === HOUSE_ID));
});

router.post('/grocery', async (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: '物品名称不能为空' });
  const item = await createItem('groceries', {
    houseId: HOUSE_ID,
    name,
    price: Number(price) || 0,
    done: false,
    createdAt: new Date().toISOString(),
  });
  setTimeout(() => res.json(item), 50);
});

router.put('/grocery/:id', async (req, res) => {
  const updated = await updateItem('groceries', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '物品不存在' });
  res.json(updated);
});

router.delete('/grocery/:id', async (req, res) => {
  const ok = await deleteItem('groceries', req.params.id);
  res.json({ ok });
});

export default router;
