import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import booksRouter from './routes/books';
import notesRouter from './routes/notes';
import usersRouter from './routes/users';
import { initDB } from './db';

const app = express();
const PORT = 3001;

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

initDB();

app.use('/api/books', booksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/users', usersRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
