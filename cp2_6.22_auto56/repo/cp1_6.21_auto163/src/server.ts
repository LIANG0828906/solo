import express from 'express';
import cors from 'cors';
import reportRouter from './ReportGenerator';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', reportRouter);

app.listen(PORT, () => {
  console.log(`[server] 学习周报 API 服务运行在 http://localhost:${PORT}`);
});
