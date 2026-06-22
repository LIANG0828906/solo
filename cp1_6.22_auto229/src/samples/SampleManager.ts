import type { Sample } from '../types';

export class SampleManager {
  private samples: Sample[] = [];
  private listeners: Set<() => void> = new Set();

  public getSamples(): Sample[] {
    return [...this.samples];
  }

  public getSampleById(id: string): Sample | undefined {
    return this.samples.find((s) => s.id === id);
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public async fetchSamples(): Promise<Sample[]> {
    try {
      const response = await fetch('/api/samples');
      const data = await response.json();
      this.samples = data.samples || [];
      this.notify();
      return this.samples;
    } catch (e) {
      console.error('Failed to fetch samples:', e);
      return this.getDemoSamples();
    }
  }

  public async uploadSample(file: File, name: string, category: Sample['category']): Promise<Sample | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('category', category);

      const response = await fetch('/api/samples', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const sample = data.sample;
      this.samples.push(sample);
      this.notify();
      return sample;
    } catch (e) {
      console.error('Failed to upload sample:', e);
      return this.createDemoSampleFromFile(file, name, category);
    }
  }

  public searchSamples(query: string): Sample[] {
    const lowerQuery = query.toLowerCase();
    return this.samples.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery)
    );
  }

  public filterByCategory(category: Sample['category'] | 'all'): Sample[] {
    if (category === 'all') return this.samples;
    return this.samples.filter((s) => s.category === category);
  }

  public sortBy(by: 'name' | 'duration' | 'category'): Sample[] {
    const sorted = [...this.samples];
    switch (by) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'duration':
        return sorted.sort((a, b) => a.duration - b.duration);
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sorted;
    }
  }

  private getDemoSamples(): Sample[] {
    const demoSamples: Sample[] = [
      {
        id: 'demo-kick-1',
        name: '底鼓 Kick 1',
        duration: 0.5,
        url: this.generateDemoAudio(60, 0.5, 'kick'),
        color: '#EF4444',
        category: 'drum',
      },
      {
        id: 'demo-snare-1',
        name: '军鼓 Snare 1',
        duration: 0.3,
        url: this.generateDemoAudio(200, 0.3, 'snare'),
        color: '#F59E0B',
        category: 'drum',
      },
      {
        id: 'demo-hihat-1',
        name: '踩镲 HiHat 1',
        duration: 0.15,
        url: this.generateDemoAudio(800, 0.15, 'hihat'),
        color: '#10B981',
        category: 'drum',
      },
      {
        id: 'demo-vocal-1',
        name: '人声切片 Vocal 1',
        duration: 1.2,
        url: this.generateDemoAudio(300, 1.2, 'vocal'),
        color: '#8B5CF6',
        category: 'vocal',
      },
      {
        id: 'demo-vocal-2',
        name: '人声哼鸣 Vocal 2',
        duration: 2.0,
        url: this.generateDemoAudio(250, 2.0, 'vocal'),
        color: '#EC4899',
        category: 'vocal',
      },
      {
        id: 'demo-effect-1',
        name: '上升音效 Rise',
        duration: 1.5,
        url: this.generateDemoAudio(100, 1.5, 'rise'),
        color: '#06B6D4',
        category: 'effect',
      },
      {
        id: 'demo-effect-2',
        name: '冲击音效 Impact',
        duration: 0.8,
        url: this.generateDemoAudio(80, 0.8, 'impact'),
        color: '#84CC16',
        category: 'effect',
      },
      {
        id: 'demo-effect-3',
        name: '氛围音 Pad',
        duration: 3.0,
        url: this.generateDemoAudio(150, 3.0, 'pad'),
        color: '#3B82F6',
        category: 'effect',
      },
    ];

    this.samples = demoSamples;
    this.notify();
    return demoSamples;
  }

  private generateDemoAudio(baseFreq: number, duration: number, type: string): string {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'kick':
          const freqK = baseFreq * Math.exp(-t * 20);
          const envK = Math.exp(-t * 12);
          sample = Math.sin(2 * Math.PI * freqK * t) * envK * 0.8;
          break;
        case 'snare':
          const noiseS = (Math.random() * 2 - 1) * Math.exp(-t * 15);
          const toneS = Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-t * 20) * 0.5;
          sample = noiseS * 0.6 + toneS;
          break;
        case 'hihat':
          const noiseH = (Math.random() * 2 - 1) * Math.exp(-t * 60);
          sample = noiseH * 0.4;
          break;
        case 'vocal':
          const vibrato = Math.sin(2 * Math.PI * 5 * t) * 3;
          const freqV = baseFreq + vibrato;
          const envV = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 2);
          sample = (Math.sin(2 * Math.PI * freqV * t) + 
                   Math.sin(2 * Math.PI * freqV * 2 * t) * 0.3 +
                   Math.sin(2 * Math.PI * freqV * 3 * t) * 0.15) * envV * 0.5;
          break;
        case 'rise':
          const freqR = baseFreq + t * 200;
          const envR = t / duration;
          sample = (Math.sin(2 * Math.PI * freqR * t) * 0.5 + 
                   Math.sin(2 * Math.PI * freqR * 1.5 * t) * 0.3) * envR * 0.4;
          break;
        case 'impact':
          const envI = Math.exp(-t * 4);
          sample = (Math.sin(2 * Math.PI * baseFreq * t) * 0.8 +
                   (Math.random() * 2 - 1) * 0.3) * envI * 0.7;
          break;
        case 'pad':
          const freqP1 = baseFreq;
          const freqP2 = baseFreq * 1.25;
          const freqP3 = baseFreq * 1.5;
          const envP = t < 0.5 ? t / 0.5 : t > duration - 0.5 ? (duration - t) / 0.5 : 1;
          sample = (Math.sin(2 * Math.PI * freqP1 * t) * 0.4 +
                   Math.sin(2 * Math.PI * freqP2 * t) * 0.3 +
                   Math.sin(2 * Math.PI * freqP3 * t) * 0.2 +
                   (Math.random() * 2 - 1) * 0.05) * envP * 0.4;
          break;
        default:
          sample = Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-t * 5) * 0.5;
      }

      buffer[i] = Math.max(-1, Math.min(1, sample));
    }

    return this.encodeWAV(buffer, sampleRate);
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): string {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const dataSize = samples.length * numChannels * bitsPerSample / 8;
    const bufferSize = 44 + dataSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private createDemoSampleFromFile(file: File, name: string, category: Sample['category']): Sample {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const sample: Sample = {
      id: `local-${Date.now()}`,
      name,
      duration: 1.0,
      url: URL.createObjectURL(file),
      color: colors[Math.floor(Math.random() * colors.length)],
      category,
    };
    this.samples.push(sample);
    this.notify();
    return sample;
  }

  public preloadSample(id: string): Promise<void> {
    const sample = this.getSampleById(id);
    if (!sample) return Promise.resolve();
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = sample.url;
      audio.preload = 'auto';
      audio.onloadeddata = () => resolve();
      audio.onerror = () => resolve();
    });
  }
}

export const sampleManager = new SampleManager();
