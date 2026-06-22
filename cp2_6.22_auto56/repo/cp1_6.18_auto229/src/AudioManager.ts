export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  init(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch {
      this.enabled = false;
    }
  }

  private ensureContext(): boolean {
    if (!this.enabled || !this.audioContext || !this.masterGain) return false;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return true;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): void {
    if (!this.ensureContext()) return;

    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);

    gain.gain.setValueAtTime(volume, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.audioContext!.currentTime + duration);
  }

  playElementSwitch(element: 'fire' | 'ice' | 'electric'): void {
    const baseFreq = element === 'fire' ? 440 : element === 'ice' ? 523 : 659;
    this.playTone(baseFreq, 0.1, 'square', 0.2);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'sine', 0.15), 50);
  }

  playAttack(): void {
    if (!this.ensureContext()) return;

    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext!.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.15);
  }

  playPickup(): void {
    this.playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(1109, 0.1, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(1319, 0.15, 'sine', 0.2), 160);
  }

  playExplosion(): void {
    if (!this.ensureContext()) return;

    const bufferSize = this.audioContext!.sampleRate * 0.2;
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.audioContext!.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = this.audioContext!.createGain();
    gain.gain.setValueAtTime(0.4, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start();
  }

  playHurt(): void {
    if (!this.ensureContext()) return;

    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext!.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.2);
  }

  playLevelUp(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.25), i * 100);
    });
  }

  playGameOver(): void {
    const notes = [392, 349, 311, 261];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.2), i * 200);
    });
  }
}
