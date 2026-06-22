import axios from 'axios';
import type { Chord } from './utils/chordParser';
import type { RhythmPattern } from './utils/rhythmCalculator';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export interface MidiGenerateRequest {
  chords: Chord[];
  tempo: number;
  rhythmPattern: RhythmPattern;
  loop: boolean;
}

export interface MidiGenerateResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

export interface SpectrumData {
  timestamp: number;
  frequencies: number[];
  magnitudes: number[];
}

export const midiApi = {
  generate: async (data: MidiGenerateRequest): Promise<MidiGenerateResponse> => {
    try {
      const response = await api.post<MidiGenerateResponse>('/midi/generate', data);
      return response.data;
    } catch (error) {
      console.error('MIDI generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const spectrumApi = {
  stream: (onData: (data: SpectrumData) => void): (() => void) => {
    const eventSource = new EventSource('/api/spectrum/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SpectrumData;
        onData(data);
      } catch (error) {
        console.error('Spectrum data parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Spectrum stream error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  },

  getLatest: async (): Promise<SpectrumData | null> => {
    try {
      const response = await api.get<SpectrumData>('/spectrum/latest');
      return response.data;
    } catch (error) {
      console.error('Get spectrum error:', error);
      return null;
    }
  },
};

export default api;
