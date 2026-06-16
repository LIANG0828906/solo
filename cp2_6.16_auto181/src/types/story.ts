import type { Story as StoryType, Panel as PanelType, Character as CharacterType, Dialog as DialogType } from './story';

export type { StoryType, PanelType, CharacterType, DialogType };

export interface Dialog {
  id: string;
  text: string;
  direction: 'left' | 'right';
}

export interface Character {
  id: string;
  type: 'boy' | 'girl' | 'robot' | 'cat';
  emoji: string;
  name: string;
  x: number;
  y: number;
  dialog?: Dialog;
}

export interface Panel {
  id: string;
  index: number;
  backgroundColor: string;
  backgroundImage?: string;
  width: number;
  height: number;
  characters: Character[];
}

export interface Story {
  id: string;
  title: string;
  panels: Panel[];
  createdAt: string;
  updatedAt: string;
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished';

export type PlaybackSpeed = 1 | 1.5 | 2;

export interface PresetCharacter {
  type: Character['type'];
  emoji: string;
  name: string;
}
