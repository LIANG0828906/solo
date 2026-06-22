import express from 'express';
import cors from 'cors';
import documentsRouter from './routes/documents.js';
import usersRouter from './routes/users.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRouter);
app.use('/api', usersRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
