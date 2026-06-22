import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadHandler, setDocumentCreatedCallback } from './uploadHandler.js';
import {
  searchHandler,
  getDocumentsHandler,
  getDocumentHandler,
  registerDocumentToIndex,
} from './searchEngine.js';

const app = express();
const PORT = 3001;

setDocumentCreatedCallback((doc) => {
  const start = Date.now();
  registerDocumentToIndex(doc);
  const elapsed = Date.now() - start;
  console.log(`[Index] Registered "${doc.name}" to inverted index in ${elapsed}ms`);
});

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
