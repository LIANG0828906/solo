import express from 'express';
import cors from 'cors';
import bookingsRouter from './routes/bookings';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingsRouter);

app.listen(PORT, () => {
  console.log(`CoSpace 后端服务已启动，监听端口 ${PORT}`);
});
