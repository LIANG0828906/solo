import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import {
  extractNoteSummary,
  computeTagFrequencies,
  NoteSummary,
  TagFrequency,
} from './parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface ScanRequest {
  folderPath: string;
}

interface ScanResponse {
  notes: NoteSummary[];
  tags: TagFrequency[];
}

function* walkMdFiles(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMdFiles(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      yield fullPath;
    }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/scan', (req, res) => {
  const { folderPath } = req.body as ScanRequest;

  if (!folderPath || typeof folderPath !== 'string') {
    return res.status(400).json({ error: 'folderPath is required' });
  }

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return res.status(400).json({ error: 'Invalid folder path' });
  }

  const notes: NoteSummary[] = [];

  for (const filePath of walkMdFiles(folderPath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const note = extractNoteSummary(uuidv4(), fileName, content);
      notes.push(note);
    } catch {
      continue;
    }
  }

  const tags = computeTagFrequencies(notes);

  const response: ScanResponse = { notes, tags };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`[server] Server running on http://localhost:${PORT}`);
});
