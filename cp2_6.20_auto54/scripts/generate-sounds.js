import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = join(__dirname, '..', 'public', 'sounds');
mkdirSync(soundsDir, { recursive: true });

function createWavBuffer(sampleData, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = sampleData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < sampleData.length; i++) {
    const sample = Math.max(-1, Math.min(1, sampleData[i]));
    const intSample = Math.floor(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return Buffer.from(buffer);
}

function generateClickSound() {
  const sampleRate = 44100;
  const duration = 0.08;
  const length = Math.floor(sampleRate * duration);
  const samples = [];
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 60);
    const tone = Math.sin(2 * Math.PI * 780 * t) * 0.6 + Math.sin(2 * Math.PI * 1040 * t) * 0.3;
    samples.push(tone * envelope);
  }
  return createWavBuffer(samples, sampleRate);
}

function generateSuccessSound() {
  const sampleRate = 44100;
  const baseDuration = 0.14;
  const gap = 0.01;
  const notes = [
    { freq: 523.25, dur: baseDuration },
    { freq: 659.25, dur: baseDuration },
    { freq: 783.99, dur: baseDuration * 1.2 },
    { freq: 1046.50, dur: baseDuration * 1.5 }
  ];
  
  const samples = [];
  let totalTime = 0;
  
  for (const note of notes) {
    const noteLength = Math.floor(sampleRate * note.dur);
    for (let i = 0; i < noteLength; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 12);
      const tone = 
        Math.sin(2 * Math.PI * note.freq * t) * 0.5 +
        Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.15 +
        Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.08;
      samples.push(tone * envelope * 0.7);
    }
    for (let i = 0; i < sampleRate * gap; i++) {
      samples.push(0);
    }
    totalTime += note.dur + gap;
  }
  
  return createWavBuffer(samples, sampleRate);
}

function generateFailSound() {
  const sampleRate = 44100;
  const duration = 0.22;
  const length = Math.floor(sampleRate * duration);
  const samples = [];
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 15);
    const freq = 220 - t * 300;
    const tone = 
      Math.sin(2 * Math.PI * freq * t) * 0.4 +
      Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.2;
    const noise = (Math.random() * 2 - 1) * 0.15 * envelope;
    samples.push((tone + noise) * envelope);
  }
  return createWavBuffer(samples, sampleRate);
}

const clickWav = generateClickSound();
const successWav = generateSuccessSound();
const failWav = generateFailSound();

writeFileSync(join(soundsDir, 'click.wav'), clickWav);
writeFileSync(join(soundsDir, 'success.wav'), successWav);
writeFileSync(join(soundsDir, 'fail.wav'), failWav);

console.log('✅ 音效文件已生成:');
console.log('  - click.wav (' + clickWav.length + ' bytes)');
console.log('  - success.wav (' + successWav.length + ' bytes)');
console.log('  - fail.wav (' + failWav.length + ' bytes)');
