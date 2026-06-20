export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateWaveformData(
  audioBuffer: AudioBuffer,
  samples: number = 100
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j]);
    }
    waveform.push(sum / blockSize);
  }

  const max = Math.max(...waveform);
  return waveform.map((v) => (max > 0 ? v / max : 0));
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  waveformData: number[],
  color: string = '#1e90ff'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const barWidth = width / waveformData.length;
  const centerY = height / 2;

  ctx.fillStyle = color;
  waveformData.forEach((value, index) => {
    const barHeight = value * (height * 0.8);
    const x = index * barWidth;
    ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
  });
}

export function logScaleMapping(
  index: number,
  totalBars: number,
  minFreq: number = 20,
  maxFreq: number = 20000
): number {
  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);
  const ratio = index / totalBars;
  const logFreq = minLog + ratio * (maxLog - minLog);
  return Math.pow(10, logFreq);
}

export function indexToFrequency(
  barIndex: number,
  totalBars: number,
  minFreq: number = 20,
  maxFreq: number = 20000
): number {
  return logScaleMapping(barIndex, totalBars, minFreq, maxFreq);
}

export function frequencyToColor(
  frequency: number,
  minFreq: number = 20,
  maxFreq: number = 20000
): string {
  const ratio =
    (Math.log10(frequency) - Math.log10(minFreq)) /
    (Math.log10(maxFreq) - Math.log10(minFreq));

  let r: number, g: number, b: number;

  if (ratio < 0.33) {
    const t = ratio / 0.33;
    r = 255;
    g = Math.floor(71 + t * (213 - 71));
    b = Math.floor(87 + t * (115 - 87));
  } else if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33;
    r = Math.floor(255 - t * (255 - 46));
    g = 213;
    b = Math.floor(115 + t * (255 - 115));
  } else {
    const t = (ratio - 0.66) / 0.34;
    r = Math.floor(46 - t * (46 - 30));
    g = Math.floor(213 - t * (213 - 144));
    b = 255;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

export function validateAudioFile(file: File): { valid: boolean; message?: string } {
  const validTypes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['wav', 'mp3'];

  if (!validTypes.includes(file.type) && !validExtensions.includes(ext || '')) {
    return { valid: false, message: '仅支持 WAV 和 MP3 格式的音频文件' };
  }

  if (file.size === 0) {
    return { valid: false, message: '文件为空' };
  }

  return { valid: true };
}
