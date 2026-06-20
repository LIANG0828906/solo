import express from 'express';
import cors from 'cors';
import path from 'path';
import resumeApi from './resumeApi.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api', resumeApi);
app.use('/uploads', express.static(path.resolve('uploads')));

app.listen(PORT, () => {
  console.log(`Resume builder server running at http://localhost:${PORT}`);
});
