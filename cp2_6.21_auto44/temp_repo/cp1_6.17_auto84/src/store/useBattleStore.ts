import { create } from 'zustand';
import { BattleEngine } from '@/game/BattleEngine';
import type { BattleCard, BattlePhase } from '@/game/types';

interface BattleState {
  player: { hp: number; maxHp: number; energy: number; maxEnergy: number; shield: number };
  enemy: { name: string; currentHp: number; maxHp: number; attack: number; skillName: string } | null;
  hand: BattleCard[];
  selectedCardIndex: number | null;
  phase: BattlePhase;
  turn: number;
  logs: string[];
  stats: { cardsUsed: number; totalDamage: number };
  deckSize: number;
  playingCardUid: string | null;
  engine: BattleEngine | null;
}

interface BattleActions {
  initGame: () => void;
  selectCard: (index: number | null) => void;
  playSelectedCard: () => void;
  endTurn: () => void;
  setPlayingCard: (uid: string | null) => void;
}

const engine = new BattleEngine();

export const useBattleStore = create<BattleState & BattleActions>((set, get) => ({
  player: { hp: 50, maxHp: 50, energy: 3, maxEnergy: 3, shield: 0 },
  enemy: null,
  hand: [],
  selectedCardIndex: null,
  phase: 'player_turn',
  turn: 0,
  logs: [],
  stats: { cardsUsed: 0, totalDamage: 0 },
  deckSize: 0,
  playingCardUid: null,
  engine: null,

  initGame: () => {
    engine.initBattle();
    set({
      player: { ...engine.player },
      enemy: engine.enemy ? { ...engine.enemy } : null,
      hand: engine.getHand(),
      selectedCardIndex: null,
      phase: engine.phase,
      turn: engine.turn,
      logs: [...engine.logs],
      stats: { ...engine.stats },
      deckSize: engine.getDeckSize(),
      playingCardUid: null,
      engine,
    });
  },

  selectCard: (index) => {
    set({ selectedCardIndex: index });
  },

  playSelectedCard: () => {
    const { selectedCardIndex, phase, playingCardUid } = get();
    if (selectedCardIndex === null || phase !== 'player_turn' || playingCardUid) return;

    const hand = engine.getHand();
    const card = hand[selectedCardIndex];
    if (!card) return;

    set({ playingCardUid: card.uid });

    setTimeout(() => {
      const result = engine.playCard(selectedCardIndex);
      if (!result.success) {
        set({ playingCardUid: null });
        if (result.log) {
          engine.logs.push(result.log);
          set({ logs: [...engine.logs] });
        }
        return;
      }

      set({
        player: { ...engine.player },
        enemy: engine.enemy ? { ...engine.enemy } : null,
        hand: engine.getHand(),
        selectedCardIndex: null,
        phase: engine.phase,
        turn: engine.turn,
        logs: [...engine.logs],
        stats: { ...engine.stats },
        deckSize: engine.getDeckSize(),
        playingCardUid: null,
      });
    }, 350);
  },

  endTurn: () => {
    const { phase } = get();
    if (phase !== 'player_turn') return;

    engine.endPlayerTurn();

    set({
      player: { ...engine.player },
      enemy: engine.enemy ? { ...engine.enemy } : null,
      hand: engine.getHand(),
      selectedCardIndex: null,
      phase: engine.phase,
      turn: engine.turn,
      logs: [...engine.logs],
      stats: { ...engine.stats },
      deckSize: engine.getDeckSize(),
    });
  },

  setPlayingCard: (uid) => {
    set({ playingCardUid: uid });
  },
}));
