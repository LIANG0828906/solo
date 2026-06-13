import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { uploadHandler } from './uploadHandler.js';
import { searchHandler, getDocumentsHandler, getDocumentHandler } from './searchEngine.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

app.post('/api/upload', upload.single('file'), uploadHandler);
app.get('/api/search', searchHandler);
app.get('/api/documents', getDocumentsHandler);
app.get('/api/documents/:id', getDocumentHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
