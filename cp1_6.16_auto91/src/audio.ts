export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicInterval: number | null = null;
  private bpm: number = 120;
  private isPlaying: boolean = false;

  init(): void {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();
    this.musicGain.connect(this.audioContext.destination);
    this.sfxGain.connect(this.audioContext.destination);
    this.musicGain.gain.value = 0.15;
    this.sfxGain.gain.value = 0.3;
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playCollectSound(): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  playHitSound(): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  playJumpSound(): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  startMusic(): void {
    if (!this.audioContext || !this.musicGain || this.isPlaying) return;
    this.isPlaying = true;
    this.scheduleMusicLoop();
  }

  stopMusic(): void {
    this.isPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicOscillator) {
      this.musicOscillator.stop();
      this.musicOscillator.disconnect();
      this.musicOscillator = null;
    }
  }

  setBPM(bpm: number): void {
    this.bpm = bpm;
    if (this.isPlaying) {
      this.stopMusic();
      this.isPlaying = true;
      this.scheduleMusicLoop();
    }
  }

  private scheduleMusicLoop(): void {
    if (!this.audioContext || !this.musicGain) return;
    
    const beatInterval = 60000 / this.bpm;
    const notes = [110, 110, 146.83, 110, 164.81, 146.83, 110, 130.81];
    let noteIndex = 0;

    const playBeat = () => {
      if (!this.isPlaying || !this.audioContext || !this.musicGain) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.type = 'square';
      osc.frequency.value = notes[noteIndex % notes.length];
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + beatInterval / 1000 * 0.9);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + beatInterval / 1000);
      
      noteIndex++;
    };

    playBeat();
    this.musicInterval = window.setInterval(playBeat, beatInterval);
  }

  destroy(): void {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioSystem = new AudioSystem();
