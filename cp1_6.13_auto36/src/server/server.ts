import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes';
import checkinRoutes from './routes/checkinRoutes';
import { updateEventStatuses, seedData } from './services/eventService';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkinRoutes);

seedData();

setInterval(() => {
  updateEventStatuses();
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`EventSnap server running on http://localhost:${PORT}`);
});
