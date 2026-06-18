import type { Track } from './types';

export interface MixPosition {
  globalStart: number;
  globalEnd: number;
  fadeInEnd: number;
  fadeOutStart: number;
}

export function computeTotalDuration(tracks: Track[], order: string[], crossfadeSec: number): number {
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    const t = tracks.find(tr => tr.id === order[i]);
    if (!t) continue;
    total += t.duration;
    if (i > 0) total -= crossfadeSec;
  }
  return Math.max(0, total);
}

export function getTrackMixPositions(
  tracks: Track[],
  order: string[],
  crossfadeSec: number
): Map<string, MixPosition> {
  const map = new Map<string, MixPosition>();
  let offset = 0;
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const t = tracks.find(tr => tr.id === id);
    if (!t) continue;
    const dur = t.duration;
    const fadeInEnd = i === 0 ? 0 : crossfadeSec;
    const fadeOutStart = i === order.length - 1 ? dur : dur - crossfadeSec;
    map.set(id, {
      globalStart: offset,
      globalEnd: offset + dur,
      fadeInEnd,
      fadeOutStart,
    });
    offset += dur;
    if (i < order.length - 1) offset -= crossfadeSec;
  }
  return map;
}

function resampleChannel(
  src: Float32Array,
  srcRate: number,
  dstRate: number
): Float32Array {
  if (srcRate === dstRate) {
    const out = new Float32Array(src.length);
    out.set(src);
    return out;
  }
  const ratio = srcRate / dstRate;
  const dstLen = Math.floor(src.length / ratio);
  const out = new Float32Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, src.length - 1);
    const frac = pos - i0;
    out[i] = src[i0] * (1 - frac) + src[i1] * frac;
  }
  return out;
}

function mixChannelData(
  orderedTracks: Track[],
  crossfadeSamples: number,
  targetSampleRate: number,
  numChannels: number,
  onProgress: (pct: number) => void
): Float32Array[] {
  const resampled: Float32Array[][] = [];
  let maxLen = 0;

  for (let i = 0; i < orderedTracks.length; i++) {
    const t = orderedTracks[i];
    const trackResampled: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      const srcCh = t.channelData[c] || t.channelData[0];
      trackResampled.push(resampleChannel(srcCh, t.sampleRate, targetSampleRate));
    }
    resampled.push(trackResampled);
    if (trackResampled[0].length > maxLen) maxLen = trackResampled[0].length;
  }

  let totalOutSamples = 0;
  for (let i = 0; i < orderedTracks.length; i++) {
    totalOutSamples += resampled[i][0].length;
    if (i > 0) totalOutSamples -= crossfadeSamples;
  }

  const output: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    output.push(new Float32Array(Math.max(totalOutSamples, 1)));
  }

  let offset = 0;
  let totalProcessed = 0;
  const reportInterval = Math.max(1, Math.floor(totalOutSamples / 20));
  let nextReport = reportInterval;

  for (let i = 0; i < orderedTracks.length; i++) {
    const trackChannels = resampled[i];
    const trackLen = trackChannels[0].length;
    const vol = orderedTracks[i].volume;

    for (let s = 0; s < trackLen; s++) {
      let envelope = 1;
      if (i > 0 && s < crossfadeSamples) {
        envelope = s / crossfadeSamples;
      }
      if (i < orderedTracks.length - 1 && s >= trackLen - crossfadeSamples) {
        envelope = Math.min(envelope, (trackLen - s) / crossfadeSamples);
      }

      for (let c = 0; c < numChannels; c++) {
        const src = trackChannels[c] || trackChannels[0];
        output[c][offset + s] += src[s] * envelope * vol;
      }

      totalProcessed++;
      if (totalProcessed >= nextReport) {
        onProgress(Math.min(99, Math.floor((totalProcessed / totalOutSamples) * 90)));
        nextReport += reportInterval;
      }
    }
    offset += trackLen;
    if (i < orderedTracks.length - 1) offset -= crossfadeSamples;
  }

  let peak = 0;
  for (let c = 0; c < numChannels; c++) {
    const ch = output[c];
    for (let i = 0; i < ch.length; i++) {
      const abs = Math.abs(ch[i]);
      if (abs > peak) peak = abs;
    }
  }
  if (peak > 0.99) {
    const norm = 0.99 / peak;
    for (let c = 0; c < numChannels; c++) {
      const ch = output[c];
      for (let i = 0; i < ch.length; i++) {
        ch[i] *= norm;
      }
    }
  }

  onProgress(95);
  return output;
}

function encodeWAV(
  channels: Float32Array[],
  sampleRate: number,
  onProgress: (pct: number) => void
): Blob {
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = 2;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  const reportInterval = Math.max(1, Math.floor(numSamples / 20));
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = channels[c][i];
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
    if (i % reportInterval === 0) {
      onProgress(95 + Math.floor((i / numSamples) * 5));
    }
  }
  onProgress(100);

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function mixdownToAudioBuffer(
  tracks: Track[],
  order: string[],
  crossfadeSec: number,
  targetSampleRate: number,
  onProgress: (pct: number) => void
): Promise<AudioBuffer> {
  const ordered = order.map(id => tracks.find(t => t.id === id)!).filter(Boolean);
  const crossfadeSamples = Math.floor(crossfadeSec * targetSampleRate);
  const numChannels = ordered.reduce((m, t) => Math.max(m, t.channels), 2);

  await new Promise(r => setTimeout(r, 0));

  const channels = mixChannelData(ordered, crossfadeSamples, targetSampleRate, numChannels, onProgress);
  const len = channels[0].length;

  let ctx: AudioContext | null = null;
  let offline: OfflineAudioContext | null = null;
  try {
    offline = new OfflineAudioContext(numChannels, len, targetSampleRate);
  } catch {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: targetSampleRate });
    } catch {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  if (offline) {
    const buf = offline.createBuffer(numChannels, len, targetSampleRate);
    for (let c = 0; c < numChannels; c++) {
      buf.copyToChannel(channels[c], c);
    }
    return buf;
  }
  if (ctx) {
    const buf = ctx.createBuffer(numChannels, len, targetSampleRate);
    for (let c = 0; c < numChannels; c++) {
      buf.copyToChannel(channels[c], c);
    }
    return buf;
  }
  throw new Error('无法创建AudioContext');
}

export async function mixdownToWavBlob(
  tracks: Track[],
  order: string[],
  crossfadeSec: number,
  targetSampleRate: number,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const ordered = order.map(id => tracks.find(t => t.id === id)!).filter(Boolean);
  const crossfadeSamples = Math.floor(crossfadeSec * targetSampleRate);
  const numChannels = ordered.reduce((m, t) => Math.max(m, t.channels), 2);

  await new Promise(r => setTimeout(r, 0));
  onProgress(1);

  const channels = mixChannelData(ordered, crossfadeSamples, targetSampleRate, numChannels, onProgress);
  return encodeWAV(channels, targetSampleRate, onProgress);
}

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}
