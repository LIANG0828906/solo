import archiver from 'archiver';
import { Exhibition } from './types';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACEHOLDER_IMAGE_PATH = path.join(__dirname, '..', 'public', 'placeholder.svg');
const EXPORT_DIR = path.join(__dirname, '..', 'exports');

export class ExportEngine {
  constructor() {
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }
  }

  async generateManual(exhibition: Exhibition): Promise<string> {
    const zipFileName = `exhibition-${exhibition.id}-${Date.now()}.zip`;
    const zipFilePath = path.join(EXPORT_DIR, zipFileName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve(`/api/exports/${zipFileName}`);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      const exhibitionData = {
        id: exhibition.id,
        name: exhibition.name,
        description: exhibition.description,
        status: exhibition.status,
        startDate: exhibition.startDate,
        endDate: exhibition.endDate,
        artworks: exhibition.artworks.map(aw => ({
          id: aw.id,
          name: aw.name,
          code: aw.code,
          description: aw.description || '',
          borrower: aw.borrower,
          transportMode: aw.transportMode,
          insuranceAmount: aw.insuranceAmount,
          transportStatus: aw.transportStatus,
          thumbnail: `thumbnails/${aw.id}.svg`
        })),
        exportedAt: new Date().toISOString()
      };

      archive.append(JSON.stringify(exhibitionData, null, 2), { name: 'exhibition.json' });

      if (fs.existsSync(PLACEHOLDER_IMAGE_PATH)) {
        const placeholderBuffer = fs.readFileSync(PLACEHOLDER_IMAGE_PATH);
        exhibition.artworks.forEach(aw => {
          archive.append(placeholderBuffer, { name: `thumbnails/${aw.id}.svg` });
        });
      }

      archive.finalize();
    });
  }

  getExportFilePath(fileName: string): string {
    const filePath = path.join(EXPORT_DIR, fileName);
    const resolvedPath = path.resolve(filePath);
    const resolvedExportDir = path.resolve(EXPORT_DIR);
    
    if (!resolvedPath.startsWith(resolvedExportDir)) {
      throw new Error('Invalid file path');
    }
    
    return resolvedPath;
  }
}
