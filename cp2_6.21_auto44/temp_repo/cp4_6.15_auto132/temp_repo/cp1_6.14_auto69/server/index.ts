import app from './app.js';
import './db.js';

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 API endpoint at http://localhost:${PORT}/api`);
  console.log(`❤️ 健康检查: http://localhost:${PORT}/api/health`);
});

const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
