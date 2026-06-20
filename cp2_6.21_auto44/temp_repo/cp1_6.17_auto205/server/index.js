import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const recordings = new Map();

function analyzePitch(audioData, sampleRate = 44100) {
  const pitchSequence = [];
  const volumeSequence = [];
  const frameSize = 2048;
  const hopSize = 512;
  
  const numFrames = Math.floor((audioData.length - frameSize) / hopSize);
  
  for (let i = 0; i < numFrames && pitchSequence.length < 256; i++) {
    const start = i * hopSize;
    const frame = audioData.slice(start, start + frameSize);
    
    let sum = 0;
    let sumSq = 0;
    for (let j = 0; j < frame.length; j++) {
      sum += frame[j];
      sumSq += frame[j] * frame[j];
    }
    const rms = Math.sqrt(sumSq / frame.length);
    volumeSequence.push(Math.min(1, rms * 5));
    
    if (rms < 0.01) {
      pitchSequence.push(0);
      continue;
    }
    
    let maxVal = 0;
    let maxIdx = 0;
    const n = frame.length;
    for (let k = 1; k < n / 2; k++) {
      let re = 0;
      let im = 0;
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        re += frame[t] * Math.cos(angle);
        im += frame[t] * Math.sin(angle);
      }
      const magnitude = Math.sqrt(re * re + im * im);
      if (magnitude > maxVal) {
        maxVal = magnitude;
        maxIdx = k;
      }
    }
    
    const frequency = maxIdx * sampleRate / n;
    const normalizedPitch = Math.min(1, Math.max(0, (frequency - 80) / 1000));
    pitchSequence.push(normalizedPitch);
  }
  
  return { pitchSequence, volumeSequence };
}

app.post('/api/record', (req, res) => {
  const { audioData, sampleRate } = req.body;
  
  if (!audioData || !Array.isArray(audioData)) {
    return res.status(400).json({ error: 'Invalid audio data' });
  }
  
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const analysis = analyzePitch(audioData, sampleRate || 44100);
  
  recordings.set(id, {
    id,
    audioData,
    sampleRate: sampleRate || 44100,
    pitchSequence: analysis.pitchSequence,
    volumeSequence: analysis.volumeSequence,
    createdAt: new Date().toISOString()
  });
  
  res.json({
    id,
    pitchSequence: analysis.pitchSequence,
    volumeSequence: analysis.volumeSequence
  });
});

app.get('/api/record/:id', (req, res) => {
  const recording = recordings.get(req.params.id);
  
  if (!recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  res.json({
    id: recording.id,
    pitchSequence: recording.pitchSequence,
    volumeSequence: recording.volumeSequence
  });
});

app.get('/api/share/:id', (req, res) => {
  const recording = recordings.get(req.params.id);
  
  if (!recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  const shareUrl = `http://localhost:5173/share/${req.params.id}`;
  res.json({ shareUrl, id: req.params.id });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', recordings: recordings.size });
});

app.listen(PORT, () => {
  console.log(`Echo Laboratory server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
