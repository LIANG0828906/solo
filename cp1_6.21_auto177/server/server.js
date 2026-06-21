import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import bidsRouter from './routes/bids.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/items', itemsRouter);
app.use('/api/bids', bidsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '虚拟拍卖会服务运行中' });
});

app.listen(PORT, () => {
  console.log(`虚拟拍卖会服务器运行在 http://localhost:${PORT}`);
});
