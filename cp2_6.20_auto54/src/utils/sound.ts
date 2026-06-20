type SoundType = 'click' | 'success' | 'fail';

const SOUND_FILES: Record<SoundType, string> = {
  click: '/sounds/click.wav',
  success: '/sounds/success.wav',
  fail: '/sounds/fail.wav'
};

class SoundManager {
  private audioCache: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled = true;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async preload(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (typeof window === 'undefined') return;
      
      const loadPromises = (Object.keys(SOUND_FILES) as SoundType[]).map((type) => {
        return new Promise<void>((resolve) => {
          try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = SOUND_FILES[type];
            audio.volume = 0.5;
            
            audio.addEventListener('canplaythrough', () => {
              this.audioCache.set(type, audio);
              resolve();
            });
            
            audio.addEventListener('error', () => {
              console.warn(`[SoundManager] Failed to load sound: ${SOUND_FILES[type]}`);
              resolve();
            });
            
            setTimeout(() => resolve(), 3000);
          } catch {
            resolve();
          }
        });
      });

      await Promise.all(loadPromises);
      this.initialized = true;
    })();

    return this.initPromise;
  }

  private getOrCreateAudio(type: SoundType): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    
    let audio = this.audioCache.get(type);
    if (!audio) {
      try {
        audio = new Audio();
        audio.src = SOUND_FILES[type];
        audio.volume = 0.5;
        this.audioCache.set(type, audio);
      } catch {
        return null;
      }
    }
    return audio;
  }

  private playFallback(type: SoundType) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const playTone = (freqs: number[], duration: number, toneType: OscillatorType = 'sine', volume: number = 0.12, overlap: number = 80) => {
        const now = ctx.currentTime;
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = toneType;
          osc.frequency.setValueAtTime(freq, now + i * overlap / 1000);
          gain.gain.setValueAtTime(0, now + i * overlap / 1000);
          gain.gain.linearRampToValueAtTime(volume, now + i * overlap / 1000 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * overlap / 1000 + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * overlap / 1000);
          osc.stop(now + i * overlap / 1000 + duration + 0.02);
        });
      };

      switch (type) {
        case 'click':
          playTone([780], 0.08, 'sine', 0.1);
          break;
        case 'success':
          playTone([523.25, 659.25, 783.99, 1046.5], 0.18, 'triangle', 0.12, 100);
          break;
        case 'fail':
          playTone([220, 180], 0.2, 'sawtooth', 0.09, 90);
          break;
      }
    } catch {
      /* ignore */
    }
  }

  async play(type: SoundType): Promise<void> {
    if (!this.enabled) return;
    
    const audio = this.getOrCreateAudio(type);
    if (!audio) {
      this.playFallback(type);
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    } catch {
      this.playFallback(type);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    const vol = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach((audio) => {
      audio.volume = vol;
    });
  }
}

export const soundManager = new SoundManager();

export { SOUND_FILES };
