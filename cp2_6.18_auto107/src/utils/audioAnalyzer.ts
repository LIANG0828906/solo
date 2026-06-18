export interface AudioAnalysisResult {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  audioBuffer: AudioBuffer;
  bpm: number;
  duration: number;
}

function computeBPM(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const step = Math.floor(sampleRate * 0.01);
  const energies: number[] = [];
  for (let i = 0; i < channelData.length; i += step) {
    let sum = 0;
    const end = Math.min(i + step, channelData.length);
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    energies.push(sum / (end - i));
  }
  const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
  const peaks: number[] = [];
  const windowSize = 43;
  for (let i = windowSize; i < energies.length - windowSize; i++) {
    let isPeak = true;
    if (energies[i] < avg * 1.2) continue;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j !== i && energies[j] >= energies[i]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) peaks.push(i);
  }
  if (peaks.length < 2) return 120;
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(peaks.length, 200); i++) {
    const interval = (peaks[i] - peaks[i - 1]) * 0.01;
    if (interval > 0.2 && interval < 2.0) {
      intervals.push(interval);
    }
  }
  if (intervals.length === 0) return 120;
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  let bpm = Math.round(60 / avgInterval);
  if (bpm > 200) bpm = Math.round(bpm / 2);
  if (bpm < 60) bpm = Math.round(bpm * 2);
  return Math.max(60, Math.min(200, bpm));
}

export async function analyzeAudio(file: File): Promise<AudioAnalysisResult> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  const gainNode = audioContext.createGain();
  normalizeVolume(audioBuffer, gainNode);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const bpm = computeBPM(audioBuffer);

  return {
    audioContext,
    analyser,
    source,
    gainNode,
    audioBuffer,
    bpm,
    duration: audioBuffer.duration,
  };
}

function normalizeVolume(audioBuffer: AudioBuffer, gainNode: GainNode) {
  const channelData = audioBuffer.getChannelData(0);
  let max = 0;
  for (let i = 0; i < channelData.length; i += 100) {
    const abs = Math.abs(channelData[i]);
    if (abs > max) max = abs;
  }
  if (max > 0 && max < 1) {
    gainNode.gain.value = 0.9 / max;
  } else if (max >= 1) {
    gainNode.gain.value = 0.9;
  } else {
    gainNode.gain.value = 1;
  }
}

export function getFrequencyDistribution(
  analyser: AnalyserNode
): { low: number; mid: number; high: number; raw: Uint8Array } {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = analyser.context.sampleRate;
  const binSize = sampleRate / (analyser.fftSize);
  const lowEnd = Math.floor(200 / binSize);
  const midEnd = Math.floor(2000 / binSize);
  const highEnd = Math.floor(20000 / binSize);

  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;

  for (let i = 0; i < Math.min(lowEnd, bufferLength); i++) {
    lowSum += dataArray[i];
  }
  for (let i = lowEnd; i < Math.min(midEnd, bufferLength); i++) {
    midSum += dataArray[i];
  }
  for (let i = midEnd; i < Math.min(highEnd, bufferLength); i++) {
    highSum += dataArray[i];
  }

  const lowCount = Math.max(1, lowEnd);
  const midCount = Math.max(1, midEnd - lowEnd);
  const highCount = Math.max(1, highEnd - midEnd);

  return {
    low: lowSum / lowCount / 255,
    mid: midSum / midCount / 255,
    high: highSum / highCount / 255,
    raw: dataArray,
  };
}
