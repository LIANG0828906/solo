import { Router } from 'express';
import { getCollection, createItem, findUserById } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const ratings = await getCollection('ratings');
  let filtered = ratings;
  if (userId) filtered = ratings.filter((r) => r.toUserId === userId || r.fromUserId === userId);

  const enriched = await Promise.all(
    filtered.map(async (r) => {
      const from = await findUserById(r.fromUserId);
      const to = await findUserById(r.toUserId);
      return {
        ...r,
        fromUser: from ? { id: from.id, nickname: from.nickname, avatar: from.avatar } : null,
        toUser: to ? { id: to.id, nickname: to.nickname, avatar: to.avatar } : null,
      };
    })
  );
  res.json(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.post('/', async (req, res) => {
  const body = req.body;
  const rating = await createItem('ratings', {
    fromUserId: body.fromUserId,
    toUserId: body.toUserId,
    dimensions: body.dimensions,
    comment: body.comment || '',
    createdAt: new Date().toISOString(),
  });
  res.json(rating);
});

export default router;
