import { defineConfig } from 'vite';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

function backupExistingSrc() {
  const srcDir = join(process.cwd(), 'src');
  const backupDir = join(process.cwd(), '.backup', new Date().toISOString().replace(/[:.]/g, '-'));
  if (existsSync(srcDir)) {
    const marker = join(srcDir, '.backup_checked');
    if (!existsSync(marker)) {
      mkdirSync(backupDir, { recursive: true });
      cpSync(srcDir, join(backupDir, 'src'), { recursive: true });
      mkdirSync(marker, { recursive: true });
    }
  }
}

try {
  backupExistingSrc();
} catch {
  // ignore backup errors
}

export default defineConfig({
  server: {
    port: 5199,
    host: true,
    strictPort: true
  }
});
