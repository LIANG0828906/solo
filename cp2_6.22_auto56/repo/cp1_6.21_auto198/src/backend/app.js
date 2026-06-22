import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import samplesRouter from './routes/samples.js';
import mixerRouter from './routes/mixer.js';
import { UPLOAD_DIR, EXPORT_DIR } from './services/fileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/exports', express.static(EXPORT_DIR));
app.use('/samples', express.static(path.resolve(__dirname, '../../samples')));

app.use('/api/samples', samplesRouter);
app.use('/api/mixer', mixerRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 采样库后端服务已启动: http://localhost:${PORT}`);
  console.log(`📁 上传目录: ${UPLOAD_DIR}`);
});
