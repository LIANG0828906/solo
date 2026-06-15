import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileRepository } from './repositories/fileRepository.js';
import { BatchService } from './services/batchService.js';
import { router as batchRouter, setBatchService } from './controllers/batchController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, '../../../data/batches.json');
const repository = new FileRepository(dataFilePath);
const batchService = new BatchService(repository);
setBatchService(batchService);

app.use('/api', batchRouter);

app.listen(PORT, () => {
  console.log(`古代水磨坊后端服务已启动`);
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API 前缀: /api`);
  console.log(`数据文件: ${dataFilePath}`);
});
