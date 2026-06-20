import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import medicinesRouter from './routes/medicines';
import compatibilityRouter from './routes/compatibility';
import prescriptionsRouter from './routes/prescriptions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/medicines', medicinesRouter);
app.use('/api/compatibility', compatibilityRouter);
app.use('/api/prescriptions', prescriptionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`古代太医院药局后端服务运行于 http://localhost:${PORT}`);
});

export default app;
