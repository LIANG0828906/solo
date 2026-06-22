import express from 'express';
import cors from 'cors';
import okrRouter from './api/okr';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api', okrRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 OKR Server 运行在 http://localhost:${PORT}`);
  console.log(`📋 默认账号:`);
  console.log(`   管理员: manager / 123456`);
  console.log(`   成员1:  member1 / 123456`);
  console.log(`   成员2:  member2 / 123456`);
  console.log(`========================================\n`);
});
