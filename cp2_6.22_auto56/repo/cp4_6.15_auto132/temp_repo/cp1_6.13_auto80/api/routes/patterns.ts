import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
const publicDir = path.join(projectRoot, 'public');
const savedDir = path.join(publicDir, 'saved');
const metadataFile = path.join(savedDir, '_metadata.json');

interface PatternParams {
  symmetryType: string;
  baseShape: string;
  colorScheme: string;
  complexity: number;
  rotationSpeed: number;
  baseColors: string[];
  backgroundColor: string;
}

interface SavedPattern {
  id: string;
  params: PatternParams;
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
    if (!fs.existsSync(metadataFile)) {
      return { version: '1.0', patterns: [] };
    }
    const data = fs.readFileSync(metadataFile, 'utf-8');
    return JSON.parse(data) as Metadata;
  } catch (error) {
    console.error('Error reading metadata:', error);
    return { version: '1.0', patterns: [] };
  }
}

function writeMetadata(metadata: Metadata): void {
  try {
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error writing metadata:', error);
    throw error;
  }
}

router.get('/patterns', (_req: Request, res: Response) => {
  try {
    const metadata = readMetadata();
    const sortedPatterns = [...metadata.patterns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.status(200).json({
      success: true,
      patterns: sortedPatterns,
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns',
    });
  }
});

router.post('/patterns', async (req: Request, res: Response) => {
  try {
    const { svgString, thumbnailBase64, params } = req.body;

    if (!svgString || !params) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: svgString and params',
      });
      return;
    }

    const id = uuidv4();
    const svgFilename = `${id}.svg`;
    const thumbnailFilename = `${id}_thumb.png`;
    const svgPath = path.join(savedDir, svgFilename);
    const thumbnailPath = path.join(savedDir, thumbnailFilename);

    fs.writeFileSync(svgPath, svgString, 'utf-8');

    if (thumbnailBase64) {
      const thumbnailBuffer = Buffer.from(thumbnailBase64, 'base64');
      const resizedBuffer = await sharp(thumbnailBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .png()
        .toBuffer();
      fs.writeFileSync(thumbnailPath, resizedBuffer);
    } else {
      const svgBuffer = Buffer.from(svgString);
      try {
        const resizedBuffer = await sharp(svgBuffer)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
            background: { r: 26, g: 26, b: 46, alpha: 1 },
          })
          .png()
          .toBuffer();
        fs.writeFileSync(thumbnailPath, resizedBuffer);
      } catch (sharpError) {
        console.warn('Failed to generate thumbnail from SVG, skipping:', sharpError);
      }
    }

    const newPattern: SavedPattern = {
      id,
      params,
      svgUrl: `/saved/${svgFilename}`,
      thumbnailUrl: `/saved/${thumbnailFilename}`,
      createdAt: new Date().toISOString(),
    };

    const metadata = readMetadata();
    metadata.patterns.unshift(newPattern);
    writeMetadata(metadata);

    res.status(201).json({
      success: true,
      pattern: newPattern,
    });
  } catch (error) {
    console.error('Error saving pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save pattern',
    });
  }
});

router.delete('/patterns/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = readMetadata();
    const patternIndex = metadata.patterns.findIndex((p) => p.id === id);

    if (patternIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Pattern not found',
      });
      return;
    }

    const pattern = metadata.patterns[patternIndex];

    const svgPath = path.join(savedDir, `${id}.svg`);
    const thumbnailPath = path.join(savedDir, `${id}_thumb.png`);

    if (fs.existsSync(svgPath)) {
      try {
        fs.unlinkSync(svgPath);
      } catch (err) {
        console.warn('Failed to delete SVG file:', err);
      }
    }

    if (fs.existsSync(thumbnailPath)) {
      try {
        fs.unlinkSync(thumbnailPath);
      } catch (err) {
        console.warn('Failed to delete thumbnail file:', err);
      }
    }

    metadata.patterns.splice(patternIndex, 1);
    writeMetadata(metadata);

    res.status(200).json({
      success: true,
      message: 'Pattern deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pattern',
    });
  }
});

export default router;
