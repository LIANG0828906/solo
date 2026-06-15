import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { seatsRouter, updateReservationStatuses } from './routes/seats';
import { sessionsRouter } from './routes/sessions';
import './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setInterval(() => {
  updateReservationStatuses();
}, 60000);

app.listen(PORT, () => {
  console.log(`Library seat reservation server running on port ${PORT}`);
});

export default app;
