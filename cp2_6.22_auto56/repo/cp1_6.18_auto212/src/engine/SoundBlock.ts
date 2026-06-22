export type SoundCategory = 'traffic' | 'nature' | 'voice' | 'electronic';

export interface SoundPreset {
  id: string;
  name: string;
  category: SoundCategory;
  audioSrc: string;
}

export interface SoundBlock {
  id: string;
  presetId: string;
  name: string;
  category: SoundCategory;
  audioSrc: string;
  hotSpotId: string;
  volume: number;
  muted: boolean;
  isOverlay?: boolean;
}

export const CATEGORY_COLORS: Record<SoundCategory, string> = {
  traffic: '#E74C3C',
  nature: '#3498DB',
  voice: '#F39C12',
  electronic: '#9B59B6',
};

export const CATEGORY_LABEL: Record<SoundCategory, string> = {
  traffic: '交通',
  nature: '自然',
  voice: '人声',
  electronic: '电子',
};

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'rain', name: '夜雨', category: 'nature', audioSrc: '/audio/rain.mp3' },
  { id: 'wind', name: '晚风', category: 'nature', audioSrc: '/audio/wind.mp3' },
  { id: 'traffic', name: '车流', category: 'traffic', audioSrc: '/audio/traffic.mp3' },
  { id: 'horn', name: '车笛', category: 'traffic', audioSrc: '/audio/horn.mp3' },
  { id: 'footstep', name: '脚步', category: 'voice', audioSrc: '/audio/footstep.mp3' },
  { id: 'chat', name: '夜话', category: 'voice', audioSrc: '/audio/chat.mp3' },
  { id: 'radio', name: '电台', category: 'electronic', audioSrc: '/audio/radio.mp3' },
  { id: 'synth', name: '合成器', category: 'electronic', audioSrc: '/audio/synth.mp3' },
];

export function createSoundBlock(
  preset: SoundPreset,
  hotSpotId: string,
  isOverlay = false,
): SoundBlock {
  return {
    id: `${preset.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    presetId: preset.id,
    name: preset.name,
    category: preset.category,
    audioSrc: preset.audioSrc,
    hotSpotId,
    volume: 80,
    muted: false,
    isOverlay,
  };
}
