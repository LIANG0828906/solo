import { useGameStore } from '@/store/useGameStore';
import { playRuneSuccess, playRuneFail, playVictory } from '@/utils/audio';

export class MatrixPuzzle {
  private errorTimers: Map<number, number> = new Map();
  private successPulses: Map<number, number> = new Map();

  constructor() {}

  public handleRuneClick(runeId: number) {
    const store = useGameStore.getState();
    if (store.phase !== 'matrix') return;

    const rune = store.runes.find((r) => r.id === runeId);
    if (!rune || rune.isActivated) return;

    const expectedIndex = store.currentRuneIndex;
    const expectedRune = store.runes.find((r) => r.correctOrder === expectedIndex);

    if (expectedRune && runeId === expectedRune.id) {
      this.onCorrect(runeId);
    } else {
      this.onWrong(runeId);
    }
  }

  private onCorrect(runeId: number) {
    const store = useGameStore.getState();
    playRuneSuccess();
    store.activateRune(runeId);
    this.successPulses.set(runeId, 0.6);

    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.phase === 'complete') {
        s.spawnVictoryBurst();
        playVictory();
      }
    }, 100);
  }

  private onWrong(runeId: number) {
    const store = useGameStore.getState();
    playRuneFail();
    store.setRuneError(runeId);
    this.errorTimers.set(runeId, 0.4);

    setTimeout(() => {
      useGameStore.getState().clearRuneError(runeId);
    }, 400);
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

  public getCorrectSequence(): number[] {
    const store = useGameStore.getState();
    return store.runes
      .slice()
      .sort((a, b) => a.correctOrder - b.correctOrder)
      .map((r) => r.id);
  }

  public dispose() {
    this.errorTimers.clear();
    this.successPulses.clear();
  }
}
