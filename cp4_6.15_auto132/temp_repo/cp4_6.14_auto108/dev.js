import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT_FILE = path.join(__dirname, '.server-port');

if (fs.existsSync(PORT_FILE)) {
  fs.unlinkSync(PORT_FILE);
}

const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
});

const waitForPortFile = () => {
  let attempts = 0;
  const check = () => {
    attempts++;
    if (fs.existsSync(PORT_FILE)) {
      console.log('Server port detected, starting Vite...');
      const vite = spawn('npx', ['vite'], {
        stdio: 'inherit',
        shell: true,
      });
      vite.on('exit', (code) => {
        server.kill();
        process.exit(code);
      });
    } else if (attempts < 30) {
      setTimeout(check, 500);
    } else {
      console.error('Server did not start in time');
      server.kill();
      process.exit(1);
    }
  };
  check();
};

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

waitForPortFile();
