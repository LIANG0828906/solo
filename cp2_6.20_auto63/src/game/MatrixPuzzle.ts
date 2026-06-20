import { useGameStore, type MatrixRune } from '@/store/useGameStore';
import { playRuneSuccess, playRuneFail, playVictory } from '@/utils/audio';

const RUNE_SYMBOLS = ['☉', '☽', '★', '◈', '⟁', '⚚', '♆', '☌', '✦'];

export class MatrixPuzzle {
  private errorTimers: Map<number, number> = new Map();
  private successPulses: Map<number, number> = new Map();
  private correctSequence: number[] = [];
  private currentStep: number = 0;
  private runes: MatrixRune[] = [];

  constructor() {}

  public generateRunes(): MatrixRune[] {
    const shuffledSymbols = this.fisherYatesShuffle([...RUNE_SYMBOLS]);
    const orderIndices = this.fisherYatesShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);

    this.runes = shuffledSymbols.slice(0, 9).map((symbol, index) => ({
      id: index,
      symbol,
      correctOrder: orderIndices[index],
      isActivated: false,
      isError: false,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    this.correctSequence = this.runes
      .slice()
      .sort((a, b) => a.correctOrder - b.correctOrder)
      .map((r) => r.id);

    this.currentStep = 0;

    return this.runes;
  }

  private fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public handleRuneClick(runeId: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'matrix') return;

    const rune = this.runes.find((r) => r.id === runeId);
    if (!rune || rune.isActivated) return;

    const expectedRuneId = this.correctSequence[this.currentStep];
    const isCorrect = runeId === expectedRuneId;

    if (isCorrect) {
      this.onCorrect(runeId);
    } else {
      this.onWrong(runeId);
    }
  }

  private onCorrect(runeId: number) {
    const store = useGameStore.getState();

    playRuneSuccess();

    const runeIndex = this.runes.findIndex((r) => r.id === runeId);
    if (runeIndex !== -1) {
      this.runes[runeIndex].isActivated = true;
    }

    store.activateRune(runeId, true);
    this.successPulses.set(runeId, 0.6);
    this.currentStep++;

    const isComplete = this.currentStep >= this.correctSequence.length;
    if (isComplete) {
      setTimeout(() => {
        const s = useGameStore.getState();
        s.spawnVictoryBurst();
        playVictory();
      }, 300);
    }
  }

  private onWrong(runeId: number) {
    const store = useGameStore.getState();

    playRuneFail();

    const runeIndex = this.runes.findIndex((r) => r.id === runeId);
    if (runeIndex !== -1) {
      this.runes[runeIndex].isError = true;
    }

    store.setRuneError(runeId);
    this.errorTimers.set(runeId, 0.4);

    setTimeout(() => {
      const s = useGameStore.getState();
      s.clearRuneError(runeId);
      const idx = this.runes.findIndex((r) => r.id === runeId);
      if (idx !== -1) {
        this.runes[idx].isError = false;
      }
    }, 400);
  }

  public validateClick(runeId: number): boolean {
    if (this.currentStep >= this.correctSequence.length) return false;
    return this.correctSequence[this.currentStep] === runeId;
  }

  public getCorrectSequence(): number[] {
    return [...this.correctSequence];
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public isComplete(): boolean {
    return this.currentStep >= this.correctSequence.length;
  }

  public tick(dt: number) {
    this.errorTimers.forEach((time, id) => {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.errorTimers.delete(id);
      } else {
        this.errorTimers.set(id, newTime);
      }
    });

    this.successPulses.forEach((time, id) => {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.successPulses.delete(id);
      } else {
        this.successPulses.set(id, newTime);
      }
    });

    const store = useGameStore.getState();
    if (store.victoryBurstActive) {
      store.updateBurstParticles(dt);
    }
  }

  public getErrorIntensity(runeId: number): number {
    const time = this.errorTimers.get(runeId);
    return time === undefined ? 0 : time / 0.4;
  }

  public getPulseIntensity(runeId: number): number {
    const time = this.successPulses.get(runeId);
    return time === undefined ? 0 : time / 0.6;
  }

  public reset() {
    this.correctSequence = [];
    this.currentStep = 0;
    this.runes = [];
    this.errorTimers.clear();
    this.successPulses.clear();
  }

  public dispose() {
    this.errorTimers.clear();
    this.successPulses.clear();
    this.correctSequence = [];
    this.runes = [];
  }
}
