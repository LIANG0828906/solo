import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');
const EXPORT_DIR = path.resolve(__dirname, '../../../exports');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

function generateWaveformData(duration) {
  const points = 100;
  const data = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const base = Math.sin(t * Math.PI) * 0.6 + 0.2;
    const noise = Math.random() * 0.3;
    data.push(Math.min(1, Math.max(0.05, base + noise)));
  }
  return data;
}

function getSampleFilePath(filename) {
  return path.join(UPLOAD_DIR, filename);
}

function saveFile(file) {
  const filename = file.filename;
  const filePath = getSampleFilePath(filename);
  return { filename, filePath, url: `/uploads/${filename}` };
}

function getExportFilePath(filename) {
  return path.join(EXPORT_DIR, filename);
}

function generateSilentWav(duration, sampleRate = 44100) {
  const numSamples = Math.floor(duration * sampleRate);
  const buffer = Buffer.alloc(44 + numSamples * 2);
  
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  
  return buffer;
}

function mixTracks(tracks) {
  const maxDuration = Math.max(...tracks.map(t => (t.loopEnd - t.loopStart) || 2), 2);
  const sampleRate = 44100;
  const numSamples = Math.floor(maxDuration * sampleRate);
  const mixed = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    mixed[i] = 0;
  }
  
  tracks.forEach((track) => {
    const volume = (track.volume || 80) / 100;
    const pan = (track.pan || 0) / 100;
    const trackSamples = Math.floor(((track.loopEnd - track.loopStart) || 2) * sampleRate);
    
    for (let i = 0; i < trackSamples && i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 80 + Math.random() * 400;
      const envelope = Math.sin((i / trackSamples) * Math.PI);
      let sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
      
      const panFactor = 1 - Math.abs(pan);
      sample *= volume * (0.5 + panFactor * 0.5);
      
      if (mixed[i] !== undefined) {
        mixed[i] += sample;
      }
    }
  });
  
  for (let i = 0; i < numSamples; i++) {
    mixed[i] = Math.max(-1, Math.min(1, mixed[i]));
  }
  
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);
  
  for (let i = 0; i < numSamples; i++) {
    const left = mixed[i] * (1 - Math.max(0, ((tracks[0]?.pan || 0) / 100)));
    const right = mixed[i] * (1 + Math.min(0, ((tracks[0]?.pan || 0) / 100)));
    buffer.writeInt16LE(Math.floor(left * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.floor(right * 32767), 44 + i * 4 + 2);
  }
  
  return buffer;
}

function exportMix(tracks, filename) {
  const wavBuffer = mixTracks(tracks);
  const filePath = getExportFilePath(filename);
  fs.writeFileSync(filePath, wavBuffer);
  return { url: `/exports/${filename}`, filename, filePath };
}

export {
  UPLOAD_DIR,
  EXPORT_DIR,
  generateWaveformData,
  getSampleFilePath,
  saveFile,
  getExportFilePath,
  generateSilentWav,
  mixTracks,
  exportMix
};
