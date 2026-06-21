import express from 'express';
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/books', bookRoutes);
app.use('/api', userRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`藏书阁 API 服务已启动: http://localhost:${PORT}`);
});
