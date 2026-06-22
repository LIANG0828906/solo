export async function requestMicrophone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

export function startRecording(
  stream: MediaStream,
  onStop: (result: RecordingResult) => void,
  onTimeUpdate: (time: number) => void,
  maxDuration = 60
): () => void {
  const chunks: BlobPart[] = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
  const recorder = new MediaRecorder(stream, { mimeType });
  const startTime = performance.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const duration = (performance.now() - startTime) / 1000;
    onStop({ blob, url, duration });
  };

  recorder.start(100);

  const interval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    onTimeUpdate(elapsed);
    if (elapsed >= maxDuration) {
      stop();
    }
  }, 100);

  const stop = () => {
    clearInterval(interval);
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    stream.getTracks().forEach((t) => t.stop());
  };

  return stop;
}

export async function extractWaveform(blob: Blob, samples = 200): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let peak = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > peak) peak = val;
      }
      waveform.push(peak);
    }

    audioCtx.close();
    return waveform;
  } catch {
    return Array(samples).fill(0).map(() => Math.random() * 0.6 + 0.2);
  }
}

export function generateDemoWaveform(samples = 200): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < samples; i++) {
    const envelope = Math.sin((i / samples) * Math.PI) * 0.8 + 0.2;
    const noise = (Math.random() - 0.5) * 0.3;
    waveform.push(Math.max(0.05, Math.min(1, envelope + noise)));
  }
  return waveform;
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnded: (() => void) | null = null;

  load(url: string) {
    this.unload();
    this.audio = new Audio(url);
    this.audio.preload = 'auto';
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio && this.onTimeUpdate) {
        this.onTimeUpdate(this.audio.currentTime);
      }
    });
    this.audio.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });
  }

  setOnTimeUpdate(cb: (time: number) => void) {
    this.onTimeUpdate = cb;
  }

  setOnEnded(cb: () => void) {
    this.onEnded = cb;
  }

  play() {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  pause() {
    if (this.audio) this.audio.pause();
  }

  seek(time: number) {
    if (this.audio) this.audio.currentTime = time;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.audio?.duration ?? 0;
  }

  unload() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}
