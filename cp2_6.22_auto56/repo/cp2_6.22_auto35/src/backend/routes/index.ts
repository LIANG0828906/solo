import { Router } from 'express';
import routeRouter from './route.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use(routeRouter);

export default router;
