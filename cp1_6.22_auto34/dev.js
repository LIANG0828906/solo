import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverProcess = spawn('node', ['src/server.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env },
});

const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env },
  shell: true,
});

const cleanup = () => {
  serverProcess.kill();
  viteProcess.kill();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
  }
  viteProcess.kill();
});

viteProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Vite process exited with code ${code}`);
  }
  serverProcess.kill();
});
