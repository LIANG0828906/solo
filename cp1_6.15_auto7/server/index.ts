import express from 'express';
import cors from 'cors';
import scheduleRoutes from './routes/scheduleRoutes.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use('/api', scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
