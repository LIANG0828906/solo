import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const publicDir = path.join(__dirname, '..', 'public');
const savedDir = path.join(publicDir, 'saved');
const metadataFile = path.join(savedDir, '_metadata.json');

interface SavedPattern {
  id: string;
  params: Record<string, unknown>;
  svgUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

interface Metadata {
  version: string;
  patterns: SavedPattern[];
}

if (!fs.existsSync(savedDir)) {
  fs.mkdirSync(savedDir, { recursive: true });
}

if (!fs.existsSync(metadataFile)) {
  const initialMetadata: Metadata = {
    version: '1.0',
    patterns: [],
  };
  fs.writeFileSync(metadataFile, JSON.stringify(initialMetadata, null, 2));
}

function readMetadata(): Metadata {
  try {
    const data = fs.readFileSync(metadataFile, 'utf-8');
    return JSON.parse(data) as Metadata;
  } catch (error) {
    return { version: '1.0', patterns: [] };
  }
}

function writeMetadata(metadata: Metadata): void {
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/saved', express.static(savedDir));

app.get('/api/patterns', (_req, res) => {
  try {
    const metadata = readMetadata();
