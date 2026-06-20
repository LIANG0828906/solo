import express from 'express';
import cors from 'cors';
import activitiesRouter from './routes/activities.js';
import socialRouter from './routes/social.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api/activities', activitiesRouter);
app.use('/api', socialRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
