import { v4 as uuidv4 } from 'uuid';

export interface AudioBlobResult {
  blob: Blob;
  duration: number;
  waveformData: number[];
}

class AudioEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private onTimeUpdate: ((time: number) => void) | null = null;

  async startRecording(): Promise<{ stream: MediaStream; analyser: AnalyserNode }> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 44100,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: 44100 });
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.recordedChunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);

    return { stream, analyser: this.analyser };
  }

  async stopRecording(): Promise<AudioBlobResult> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        throw new Error('No recording in progress');
      }

      const duration = (Date.now() - this.startTime) / 1000;

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const waveformData = this.generateWaveformData(10);

        this.cleanupRecording();
        resolve({ blob, duration, waveformData });
      };

      this.mediaRecorder.stop();
    });
  }

  private generateWaveformData(count: number): number[] {
    return Array.from({ length: count }, () => 0.3 + Math.random() * 0.7);
  }

  getRealTimeWaveform(analyser: AnalyserNode): number[] {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const bars = 10;
    const step = Math.floor(bufferLength / bars);
    const waveform: number[] = [];

    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      waveform.push(sum / step / 255);
    }

    return waveform;
  }

  playAudio(audioUrl: string, onTimeUpdate?: (time: number) => void): void {
    this.stopAudio();
    this.onTimeUpdate = onTimeUpdate || null;

    this.audioElement = new Audio(audioUrl);
    this.audioElement.play().catch(() => {});

    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.addEventListener('ended', this.handleEnded);
  }

  private handleTimeUpdate = (): void => {
    if (this.audioElement && this.onTimeUpdate) {
      this.onTimeUpdate(this.audioElement.currentTime);
    }
  };

  private handleEnded = (): void => {
    if (this.onTimeUpdate) {
      this.onTimeUpdate(0);
    }
  };

  pauseAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  resumeAudio(): void {
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    }
  }

  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.audioElement.removeEventListener('ended', this.handleEnded);
      this.audioElement.src = '';
      this.audioElement = null;
    }
    this.onTimeUpdate = null;
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  seekTo(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration || 0, time));
    }
  }

  getDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        audio.src = '';
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
    });
  }

  private cleanupRecording(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.mediaRecorder = null;
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanupRecording();
    this.recordedChunks = [];
  }

  generateId(): string {
    return uuidv4();
  }
}

export const audioEngine = new AudioEngine();
