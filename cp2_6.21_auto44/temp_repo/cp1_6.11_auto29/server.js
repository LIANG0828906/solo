import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distServer = join(__dirname, 'dist', 'server.js');

console.log('启动差异计算后端服务...');
await import(pathToFileURL(distServer).href);
