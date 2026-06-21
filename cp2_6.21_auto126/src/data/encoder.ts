import { InstrumentType, EngineState, TrackState } from '../engine/audioEngine';

interface SerializableState {
  v: number;
  bpm: number;
  mv: number;
  t: {
    d: { v: number; b: string };
    ba: { v: number; b: string };
    s: { v: number; b: string };
    e: { v: number; b: string };
  };
}

const INSTRUMENT_KEYS: Record<InstrumentType, keyof SerializableState['t']> = {
  drums: 'd',
  bass: 'ba',
  synth: 's',
  effects: 'e',
};

const KEY_TO_INSTRUMENT: Record<string, InstrumentType> = {
  d: 'drums',
  ba: 'bass',
  s: 'synth',
  e: 'effects',
};

export const encodeState = (state: {
  bpm: number;
  masterVolume: number;
  tracks: Record<InstrumentType, TrackState>;
}): string => {
  const beatsToString = (beats: boolean[][]): string => {
    let result = '';
    for (let bar = 0; bar < 8; bar++) {
      for (let beat = 0; beat < 8; beat++) {
        result += beats[bar][beat] ? '1' : '0';
      }
    }
    return result;
  };

  const serializable: SerializableState = {
    v: 1,
    bpm: state.bpm,
    mv: Math.round(state.masterVolume * 100),
    t: {
      d: {
        v: Math.round(state.tracks.drums.volume * 100),
        b: beatsToString(state.tracks.drums.beats),
      },
      ba: {
        v: Math.round(state.tracks.bass.volume * 100),
        b: beatsToString(state.tracks.bass.beats),
      },
      s: {
        v: Math.round(state.tracks.synth.volume * 100),
        b: beatsToString(state.tracks.synth.beats),
      },
      e: {
        v: Math.round(state.tracks.effects.volume * 100),
        b: beatsToString(state.tracks.effects.beats),
      },
    },
  };

  const jsonString = JSON.stringify(serializable);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64;
};

export const decodeState = (encoded: string): {
  bpm: number;
  masterVolume: number;
  tracks: Record<InstrumentType, TrackState>;
} | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(jsonString) as SerializableState;

    if (data.v !== 1) {
      return null;
    }

    const stringToBeats = (str: string): boolean[][] => {
      const beats: boolean[][] = [];
      let index = 0;
      for (let bar = 0; bar < 8; bar++) {
        beats[bar] = [];
        for (let beat = 0; beat < 8; beat++) {
          beats[bar][beat] = str[index] === '1';
          index++;
        }
      }
      return beats;
    };

    const tracks: Record<InstrumentType, TrackState> = {
      drums: {
        volume: data.t.d.v / 100,
        beats: stringToBeats(data.t.d.b),
      },
      bass: {
        volume: data.t.ba.v / 100,
        beats: stringToBeats(data.t.ba.b),
      },
      synth: {
        volume: data.t.s.v / 100,
        beats: stringToBeats(data.t.s.b),
      },
      effects: {
        volume: data.t.e.v / 100,
        beats: stringToBeats(data.t.e.b),
      },
    };

    return {
      bpm: data.bpm,
      masterVolume: data.mv / 100,
      tracks,
    };
  } catch (e) {
    return null;
  }
};

export const generateShareLink = (state: {
  bpm: number;
  masterVolume: number;
  tracks: Record<InstrumentType, TrackState>;
}): string => {
  const encoded = encodeState(state);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?r=${encoded}`;
};

export const parseShareLink = (): {
  bpm: number;
  masterVolume: number;
  tracks: Record<InstrumentType, TrackState>;
} | null => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('r');
  if (!encoded) return null;
  return decodeState(encoded);
};
