import { SoundSample, SoundIconMap } from './types';

const API_BASE = '/api';

export async function fetchInitData(): Promise<{ samples: SoundSample[] }> {
  try {
    const res = await fetch(`${API_BASE}/initData`);
    if (!res.ok) return { samples: [] };
    return await res.json();
  } catch {
    return { samples: [] };
  }
}

export async function fetchSoundIcons(): Promise<SoundIconMap> {
  try {
    const res = await fetch(`${API_BASE}/soundIcons`);
    if (!res.ok) return {} as SoundIconMap;
    return await res.json();
  } catch {
    return {} as SoundIconMap;
  }
}
