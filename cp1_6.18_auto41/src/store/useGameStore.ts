import { create } from 'zustand';
import { GameEngine } from '../GameEngine';
import { AudioEngine } from '../AudioEngine';
import { BASE_BPM } from '../types';

type GameStore = {
  gameEngine: GameEngine | null;
  audioEngine: AudioEngine | null;
  initEngines: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  gameEngine: null,
  audioEngine: null,
  initEngines: () => {
    const audioEngine = new AudioEngine(BASE_BPM);
    const gameEngine = new GameEngine(audioEngine);
    set({ audioEngine, gameEngine });
  },
}));
