import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as http from 'http';
import * as net from 'net';
import contractRoutes from './routes/contractRoutes';
import wsManager from './websocket/wsManager';

const DEFAULT_PORT = 3001;
const MAX_PORT_TRIES = 10;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    let resolved = false;
    const finish = (available: boolean): void => {
      if (resolved) return;
      resolved = true;
      resolve(available);
    };
    server.once('error', () => finish(false));
    server.once('listening', () => {
      server.close((err) => {
        if (err) {
          console.warn(`Warning: Failed to close test server on port ${port}:`, err.message);
        }
        setTimeout(() => finish(true), 50);
      });
    });
    try {
      server.listen(port);
    } catch (err) {
      finish(false);
    }
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  for (let offset = 0; offset < MAX_PORT_TRIES; offset++) {
    const port = startPort + offset;
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} is in use, trying next port...`);
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + MAX_PORT_TRIES - 1}`);
}

async function startServer(): Promise<void> {
  const app: Express = express();
  const port = await findAvailablePort(DEFAULT_PORT);

  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/api/port', (_req, res) => {
    res.json({ port });
  });

  app.use('/api', contractRoutes);

  const server: http.Server = http.createServer(app);

  wsManager.init(server);

  server.listen(port, () => {
    console.log('========================================');
    console.log('  Contract Approval Server');
    console.log('========================================');
    console.log(`HTTP server running on http://localhost:${port}`);
    console.log(`WebSocket server running on ws://localhost:${port}/ws`);
    console.log(`API endpoints available at http://localhost:${port}/api`);
    console.log(`Get port info: GET http://localhost:${port}/api/port`);
    console.log('========================================');
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export {};
