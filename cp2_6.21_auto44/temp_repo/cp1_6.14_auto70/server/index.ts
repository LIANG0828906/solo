import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low, JSONFile } from 'lowdb';
import gameRouter, { initDatabase } from './routes/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Database {
  rooms: Record<string, any>;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());

  const dbPath = path.resolve(__dirname, '..', 'database.json');
  const adapter = new JSONFile<Database>(dbPath);
  const db = new Low<Database>(adapter);

  await db.read();
  db.data ||= { rooms: {} };
  await db.write();

  initDatabase(db);

  app.use('/api/game', gameRouter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      rooms: Object.keys(db.data?.rooms || {}).length,
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ message: 'API Not Found' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  });

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║      🎲 桌游伴侣服务端已启动                  ║
║      🌐 监听端口: ${PORT}                         ║
║      📁 数据库: ${dbPath.replace(/\\/g, '/')}
║      ⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}          ║
╚══════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((err) => {
  console.error('服务启动失败:', err);
  process.exit(1);
});
