import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const MANIFEST_PATH = path.join(UPLOADS_DIR, 'manifest.json');

interface Manifest {
  [audioId: string]: string;
}

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readManifest(): Promise<Manifest> {
  try {
    const data = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await ensureUploadsDir();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

export async function saveAudioFile(audioId: string, filePath: string): Promise<void> {
  await ensureUploadsDir();
  const fileName = path.basename(filePath);
  const destPath = path.join(UPLOADS_DIR, fileName);

  await fs.copyFile(filePath, destPath);

  const manifest = await readManifest();
  manifest[audioId] = fileName;
  await writeManifest(manifest);
}

export async function getAudioFilePath(audioId: string): Promise<string | null> {
  const manifest = await readManifest();
  const fileName = manifest[audioId];
  if (!fileName) return null;

  const filePath = path.join(UPLOADS_DIR, fileName);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export async function deleteAudioFile(audioId: string): Promise<void> {
  const manifest = await readManifest();
  const fileName = manifest[audioId];
  if (!fileName) return;

  const filePath = path.join(UPLOADS_DIR, fileName);
  try {
    await fs.unlink(filePath);
  } catch {
    // file may already be gone
  }

  delete manifest[audioId];
  await writeManifest(manifest);
}

export async function listAudioFiles(): Promise<string[]> {
  const manifest = await readManifest();
  return Object.keys(manifest);
}
