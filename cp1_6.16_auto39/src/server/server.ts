import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { saveAudioFile, getAudioFilePath, deleteAudioFile } from './audioStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const CLIPS_PATH = path.join(UPLOADS_DIR, 'clips.json');
const PORT = 3001;

interface ClipData {
  id: string;
  name: string;
  audioId: string;
  fileName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface ExportTrackClip {
  clipId: string;
  clipName: string;
  audioId: string;
  startTime: number;
  endTime: number;
  trackStartTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

interface ExportTrack {
  id: number;
  name: string;
  color: string;
  volume: number;
  clips: ExportTrackClip[];
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only mp3 and wav files are allowed'));
    }
  },
});

async function readClips(): Promise<ClipData[]> {
  try {
    const data = await fs.readFile(CLIPS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeClips(clips: ClipData[]): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(CLIPS_PATH, JSON.stringify(clips, null, 2), 'utf-8');
}

async function startServer(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const audioId = uuidv4();
      await saveAudioFile(audioId, file.path);

      res.json({ audioId, fileName: file.originalname });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.get('/api/clips', async (_req, res) => {
    try {
      const clips = await readClips();
      res.json(clips);
    } catch (err) {
      console.error('Read clips error:', err);
      res.status(500).json({ error: 'Failed to read clips' });
    }
  });

  app.post('/api/clips', async (req, res) => {
    try {
      const clip = req.body as Omit<ClipData, 'id'>;
      const newClip: ClipData = { ...clip, id: uuidv4() };

      const clips = await readClips();
      clips.push(newClip);
      await writeClips(clips);

      res.json(newClip);
    } catch (err) {
      console.error('Create clip error:', err);
      res.status(500).json({ error: 'Failed to create clip' });
    }
  });

  app.delete('/api/clips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let clips = await readClips();
      const target = clips.find((c) => c.id === id);

      if (!target) {
        res.status(404).json({ error: 'Clip not found' });
        return;
      }

      clips = clips.filter((c) => c.id !== id);
      await writeClips(clips);

      res.json({ success: true });
    } catch (err) {
      console.error('Delete clip error:', err);
      res.status(500).json({ error: 'Failed to delete clip' });
    }
  });

  app.post('/api/export', async (req, res) => {
    try {
      const { tracks } = req.body as { tracks: ExportTrack[] };
      if (!tracks || !Array.isArray(tracks)) {
        res.status(400).json({ error: 'Invalid tracks data' });
        return;
      }

      const allClips: ExportTrackClip[] = tracks.flatMap((t) => t.clips);
      if (allClips.length === 0) {
        res.status(400).json({ error: 'No clips to export' });
        return;
      }

      let maxEndTime = 0;
      for (const clip of allClips) {
        const end = clip.trackStartTime + (clip.endTime - clip.startTime);
        if (end > maxEndTime) maxEndTime = end;
      }

      const ffmpegAvailable = await checkFfmpeg();

      if (ffmpegAvailable) {
        await exportWithFfmpeg(tracks, maxEndTime, res);
      } else {
        await exportWithFallback(tracks, res);
      }
    } catch (err) {
      console.error('Export error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`Podcast Studio server running on http://localhost:${PORT}`);
  });
}

function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('exit', (code) => resolve(code === 0));
  });
}

async function exportWithFfmpeg(
  tracks: ExportTrack[],
  maxEndTime: number,
  res: express.Response
): Promise<void> {
  const tmpDir = path.join(UPLOADS_DIR, `export_${uuidv4()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const clipFiles: string[] = [];
  const delayMsList: number[] = [];

  const allClips: Array<{ track: ExportTrack; clip: ExportTrackClip }> = [];
  for (const track of tracks) {
    for (const clip of track.clips) {
      allClips.push({ track, clip });
    }
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="podcast_export.mp3"');

  for (let n = 0; n < allClips.length; n++) {
    const { track, clip } = allClips[n];
    const inputPath = await getAudioFilePath(clip.audioId);
    if (!inputPath) continue;

    const outFile = path.join(tmpDir, `clip_${n}.mp3`);
    const duration = clip.endTime - clip.startTime;
    const volumeMultiplier = (track.volume / 100) * (clip.volume / 100);

    const filterChain: string[] = [];
    filterChain.push(`volume=${volumeMultiplier}`);
    if (clip.fadeIn > 0) {
      filterChain.push(`afade=t=in:st=0:d=${clip.fadeIn}`);
    }
    if (clip.fadeOut > 0) {
      const fadeOutStart = Math.max(0, duration - clip.fadeOut);
      filterChain.push(`afade=t=out:st=${fadeOutStart}:d=${clip.fadeOut}`);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(clip.startTime)
        .duration(duration)
        .audioCodec('libmp3lame')
        .audioFilters(filterChain)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outFile);
    });

    clipFiles.push(outFile);
    delayMsList.push(Math.round(clip.trackStartTime * 1000));

    const progress = Math.round(((n + 1) / allClips.length) * 50);
    if (!res.headersSent) {
      res.write(`\n`);
    }
  }

  if (clipFiles.length === 0) {
    if (!res.headersSent) {
      res.status(400).json({ error: 'No valid audio files found for export' });
    }
    await cleanup(tmpDir);
    return;
  }

  const N = clipFiles.length;
  const filterArray: string[] = [];

  for (let i = 0; i < N; i++) {
    const delay = delayMsList[i];
    filterArray.push(`[${i}:a]adelay=${delay}|${delay}[delayed${i}]`);
  }

  for (let i = 0; i < N; i++) {
    filterArray.push(`[delayed${i}]apad=whole_dur=${maxEndTime}s[padded${i}]`);
  }

  const paddedLabels = Array.from({ length: N }, (_, i) => `[padded${i}]`).join('');
  filterArray.push(`${paddedLabels}amix=inputs=${N}:duration=first:dropout_transition=0,dynaudnorm=f=150:g=15[out]`);

  const mixFile = path.join(tmpDir, 'mix.mp3');

  await new Promise<void>((resolve, reject) => {
    let cmd = ffmpeg();
    for (const file of clipFiles) {
      cmd = cmd.input(file);
    }
    cmd
      .complexFilter(filterArray, 'out')
      .audioCodec('libmp3lame')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(mixFile);
  });

  const stream = createReadStream(mixFile);
  stream.pipe(res);

  stream.on('end', () => {
    cleanup(tmpDir);
  });
  stream.on('error', () => {
    cleanup(tmpDir);
  });
}

async function exportWithFallback(
  tracks: ExportTrack[],
  res: express.Response
): Promise<void> {
  const allClips = tracks.flatMap((t) => t.clips);
  const files: string[] = [];

  for (const clip of allClips) {
    const inputPath = await getAudioFilePath(clip.audioId);
    if (inputPath) files.push(inputPath);
  }

  if (files.length === 0) {
    res.status(400).json({ error: 'No valid audio files found for export' });
    return;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="podcast_export.mp3"');
  res.setHeader('X-Export-Mode', 'fallback');
  res.setHeader('X-Clip-Count', String(files.length));

  for (let i = 0; i < files.length; i++) {
    const data = await fs.readFile(files[i]);
    res.write(data);
  }

  res.end();
}

async function cleanup(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
