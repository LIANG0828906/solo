const NOTE_FREQUENCIES = [
  261.63, 277.18, 293.66, 311.13, 329.63, 349.23,
  369.99, 392.00, 415.30, 440.00, 466.16, 493.88,
];

export const getNoteFrequency = (pitch: number, octave: number = 4): number => {
  const baseFreq = NOTE_FREQUENCIES[pitch % 12];
  return baseFreq * Math.pow(2, octave - 4);
};

export const getNoteName = (pitch: number): string => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[pitch % 12];
};

export class AudioSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
    
    this.createReverb();
  }

  private async createReverb() {
    if (!this.audioContext || !this.masterGain) return;
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.masterGain);
  }

  playNote(pitch: number, duration: number = 1.5, velocity: number = 0.5) {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const frequency = getNoteFrequency(pitch);
    const now = this.audioContext.currentTime;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 2;
    osc2.detune.value = 7;

    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(velocity * 0.2, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    
    if (this.reverbNode) {
      const dryGain = this.audioContext.createGain();
      const wetGain = this.audioContext.createGain();
      dryGain.gain.value = 0.6;
      wetGain.gain.value = 0.4;
      
      gainNode.connect(dryGain);
      gainNode.connect(wetGain);
      dryGain.connect(this.masterGain);
      wetGain.connect(this.reverbNode);
    } else {
      gainNode.connect(this.masterGain);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  playChord(rootPitch: number, intervals: number[], duration: number = 2) {
    intervals.forEach((interval, i) => {
      setTimeout(() => {
        this.playNote(rootPitch + interval, duration, 0.3);
      }, i * 100);
    });
  }

  playTideSound() {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    const now = this.audioContext.currentTime;
    const bufferSize = this.audioContext.sampleRate * 3;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(800, now + 1.5);
    filter.frequency.linearRampToValueAtTime(200, now + 3);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 3);
  }
}

export const audioSynth = new AudioSynthesizer();
