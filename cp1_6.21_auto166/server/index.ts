import express from 'express';
import cors from 'cors';
import activitiesRouter from './routes/activities';
import participationRouter from './routes/participation';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/activities', activitiesRouter);
app.use('/api/participation', participationRouter);

app.listen(PORT, () => {
  console.log('Activity Engine server running on port 3001');
});
