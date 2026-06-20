export type VoiceCommand = 'jump' | 'crouch' | 'dash' | null;

export interface AudioCallbacks {
  onVolumeChange: (volume: number) => void;
  onCommand: (command: VoiceCommand, confidence: number) => void;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private recognition: any = null;
  private callbacks: AudioCallbacks;
  private isRunning: boolean = false;
  private volumeHistory: number[] = [];
  private lastVolume: number = 0;

  constructor(callbacks: AudioCallbacks) {
    this.callbacks = callbacks;
  }

  async init(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      this.initSpeechRecognition();
      this.isRunning = true;
      this.startVolumeMonitor();
      return true;
    } catch (e) {
      console.error('Failed to initialize audio:', e);
      return false;
    }
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN,en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal) {
          this.processSpeechResult(result);
        } else {
          const transcript = result[0].transcript.trim().toLowerCase();
          const confidence = result[0].confidence || 0.5;
          const command = this.parseCommand(transcript);
          if (command && confidence >= 0.8) {
            this.callbacks.onCommand(command, confidence);
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (this.isRunning && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Failed to restart recognition');
        }
      }
    };

    this.recognition.onend = () => {
      if (this.isRunning && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Failed to restart recognition on end');
        }
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Failed to start recognition:', e);
    }
  }

  private processSpeechResult(result: any): void {
    for (let i = 0; i < result.length; i++) {
      const transcript = result[i].transcript.trim().toLowerCase();
      const confidence = result[i].confidence || 0.5;
      const command = this.parseCommand(transcript);
      if (command && confidence >= 0.8) {
        this.callbacks.onCommand(command, confidence);
        break;
      }
    }
  }

  private parseCommand(text: string): VoiceCommand {
    const jumpWords = ['跳', '跳跃', '跳一下', 'jump', 'hop', 'leap', 'skip'];
    const crouchWords = ['蹲', '蹲下', '蹲伏', 'crouch', 'duck', 'down', '低'];
    const dashWords = ['冲', '冲刺', '快跑', 'dash', 'sprint', 'run', '加速'];

    for (const word of jumpWords) {
      if (text.includes(word)) return 'jump';
    }
    for (const word of crouchWords) {
      if (text.includes(word)) return 'crouch';
    }
    for (const word of dashWords) {
      if (text.includes(word)) return 'dash';
    }

    return null;
  }

  private startVolumeMonitor(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isRunning || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const volumeDb = this.amplitudeToDb(average);

      this.volumeHistory.push(volumeDb);
      if (this.volumeHistory.length > 5) {
        this.volumeHistory.shift();
      }

      const smoothed = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
      const clamped = Math.max(0, Math.min(100, smoothed));

      if (Math.abs(clamped - this.lastVolume) > 0.5) {
        this.lastVolume = clamped;
        this.callbacks.onVolumeChange(clamped);
      }

      requestAnimationFrame(update);
    };

    update();
  }

  private amplitudeToDb(amplitude: number): number {
    if (amplitude <= 0) return 0;
    const db = 20 * Math.log10(amplitude / 255) + 100;
    return Math.max(0, Math.min(100, db));
  }

  destroy(): void {
    this.isRunning = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  isReady(): boolean {
    return this.isRunning && this.analyser !== null;
  }
}
