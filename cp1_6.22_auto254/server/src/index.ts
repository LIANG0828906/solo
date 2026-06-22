import express from 'express';
import cors from 'cors';
import drinksRouter from './routes/drinks';
import ingredientsRouter from './routes/ingredients';
import salesRouter from './routes/sales';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/drinks', drinksRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/sales', salesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '咖啡馆管理系统后端服务正常运行' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API 文档:`);
  console.log(`  GET    /api/drinks          - 获取饮品列表`);
  console.log(`  POST   /api/drinks          - 创建饮品`);
  console.log(`  GET    /api/ingredients     - 获取原料列表`);
  console.log(`  POST   /api/ingredients     - 创建原料`);
  console.log(`  GET    /api/sales           - 获取销售记录`);
  console.log(`  POST   /api/sales           - 创建销售记录`);
  console.log(`  GET    /api/sales/today     - 获取今日销售统计`);
  console.log(`  GET    /api/sales/report/30days - 获取30天报告数据`);
});

export default app;
