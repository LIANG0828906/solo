import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  db.read();
  const users = db.data!.users.map(u => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    role: u.role,
  }));
  res.json(users);
});

router.get('/current', (req, res) => {
  db.read();
  const user = db.data!.users.find(u => u.id === db.data!.currentUserId) || db.data!.users[0];
  res.json(user);
});

export default router;
