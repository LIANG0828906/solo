import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface Note {
  string: number;
  fret: number;
}

interface Chord {
  id: string;
  notes: Note[];
  type: 'major' | 'minor' | 'dominant7';
  rootNote: string;
  duration: number;
  color: string;
}

interface RhythmPattern {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4' | '6/8' | '12/8';
  beatPattern: boolean[];
  description: string;
}

interface MidiGenerateRequest {
  chords: Chord[];
  tempo: number;
  rhythmPattern: RhythmPattern;
  loop: boolean;
}

interface MidiGenerateResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

interface SpectrumData {
  timestamp: number;
  frequencies: number[];
  magnitudes: number[];
}

const STRING_FREQUENCIES = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

function getNoteFrequency(note: Note): number {
  const baseFreq = STRING_FREQUENCIES[note.string];
  return baseFreq * Math.pow(2, note.fret / 12);
}

function generateSpectrumFrame(baseFrequencies: number[], frame: number): number[] {
  const fftSize = 256;
  const magnitudes = new Array(fftSize).fill(0);

  baseFrequencies.forEach((freq, idx) => {
    const binIndex = Math.floor((freq / 20000) * fftSize);
    const peak = Math.sin(frame * 0.05 + idx) * 0.3 + 0.5;
    const noise = Math.random() * 0.1;
    
    for (let i = -2; i <= 2; i++) {
      const bin = Math.max(0, Math.min(fftSize - 1, binIndex + i));
      const falloff = 1 - Math.abs(i) * 0.2;
      magnitudes[bin] = Math.min(1, magnitudes[bin] + peak * falloff + noise);
    }
  });

  for (let i = 0; i < fftSize; i++) {
    const noiseFloor = Math.sin(i * 0.01 + frame * 0.02) * 0.05 + 0.1;
    magnitudes[i] = Math.max(magnitudes[i], noiseFloor * Math.random());
  }

  return magnitudes;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ChordViz API server is running' });
});

app.post('/api/midi/generate', (req: Request<unknown, unknown, MidiGenerateRequest>, res: Response<MidiGenerateResponse>) => {
  try {
    const { chords, tempo, rhythmPattern, loop } = req.body;

    if (!chords || chords.length === 0) {
      return res.json({
        success: false,
        error: 'No chords provided',
      });
    }

    const beatsPerMeasure = parseInt(rhythmPattern.timeSignature.split('/')[0]);
    const totalBeats = chords.reduce((sum, chord) => sum + chord.duration, 0);
    const duration = (totalBeats / tempo) * 60 * (loop ? 2 : 1);

    console.log(`Generating MIDI: ${chords.length} chords, ${tempo} BPM, ${rhythmPattern.name}, duration: ${duration.toFixed(2)}s`);

    res.json({
      success: true,
      duration,
      message: 'MIDI generation simulated - using Web Audio API on frontend',
    });
  } catch (error) {
    console.error('MIDI generation error:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

let currentSpectrumFrame = 0;
let activeFrequencies: number[] = [];
let isStreaming = false;

app.get('/api/spectrum/latest', (_req: Request, res: Response<SpectrumData>) => {
  const magnitudes = generateSpectrumFrame(activeFrequencies, currentSpectrumFrame);
  currentSpectrumFrame++;

  res.json({
    timestamp: Date.now(),
    frequencies: magnitudes.map((_, i) => (i / 256) * 20000),
    magnitudes,
  });
});

app.get('/api/spectrum/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  isStreaming = true;
  let frame = 0;

  const sendFrame = () => {
    if (!isStreaming) return;

    const magnitudes = generateSpectrumFrame(activeFrequencies, frame);
    const data: SpectrumData = {
      timestamp: Date.now(),
      frequencies: magnitudes.map((_, i) => (i / 256) * 20000),
      magnitudes,
    };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
    frame++;

    setTimeout(sendFrame, 1000 / 30);
  };

  sendFrame();

  req.on('close', () => {
    isStreaming = false;
    res.end();
  });
});

app.post('/api/spectrum/active', (req: Request, res: Response) => {
  const { notes }: { notes: Note[] } = req.body;
  activeFrequencies = notes ? notes.map(getNoteFrequency) : [];
  res.json({ success: true, frequencies: activeFrequencies });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🎵 ChordViz API Server                                 ║
  ║                                                          ║
  ║   🚀 Running on: http://localhost:${PORT}                  ║
  ║                                                          ║
  ║   📡 Endpoints:                                          ║
  ║      GET  /api/health           - Health check           ║
  ║      POST /api/midi/generate     - Generate MIDI         ║
  ║      GET  /api/spectrum/latest   - Get latest spectrum   ║
  ║      GET  /api/spectrum/stream   - SSE spectrum stream   ║
  ║      POST /api/spectrum/active   - Set active notes      ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});
