import express from 'express';
import cors from 'cors';
import materialsRouter from './materialsRouter';
import inventoryRouter from './inventoryRouter';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/materials', materialsRouter);
app.use('/api/inventory', inventoryRouter);

app.get('/api', (req, res) => {
  res.json({ message: '手工艺材料库存管理 API' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
