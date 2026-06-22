import { deepClone, shuffleArray, type ElementType, encryptSequence, decryptSequence, generateSequence } from '../utils/helpers';
import type { Level, GroovePosition } from '../data/LevelData';

export type GameState = 'idle' | 'playing' | 'completed' | 'failed';

export interface PlacedRune {
  runeId: string;
  grooveId: string;
  element: ElementType;
  isLocked: boolean;
  placedAt: number;
}

export interface EngineEvents {
  runePlaced: (data: { runeId: string; grooveId: string; element: ElementType; success: boolean }) => void;
  elementActivated: (data: { element: ElementType; x: number; y: number }) => void;
  chainReaction: (data: { positions: GroovePosition[] }) => void;
  levelCompleted: () => void;
  levelReset: () => void;
  progressUpdated: (data: { current: number; total: number }) => void;
  pulseEffect: (data: { grooveId: string }) => void;
  waveEffect: () => void;
}

export class GameEngine {
  private level: Level;
  private state: GameState = 'idle';
  private placedRunes: Map<string, PlacedRune> = new Map();
  private activatedSequence: ElementType[] = [];
  private targetSequence: ElementType[] = [];
  private encryptedSequence: string = '';
  private runePositions: Map<string, { x: number; y: number }> = new Map();
  private eventListeners: Map<keyof EngineEvents, Set<EngineEvents[keyof EngineEvents]>> = new Map();
  private currentStep: number = 0;
  private unlockedCombos: Set<string> = new Set();
  private chainReactionQueue: Array<() => void> = [];

  constructor(level: Level) {
    this.level = level;
    this.initializeLevel();
  }

  private initializeLevel(): void {
    this.state = 'playing';
    this.currentStep = 0;
    this.placedRunes.clear();
    this.activatedSequence = [];
    this.unlockedCombos.clear();
    this.chainReactionQueue = [];

    const availableElements = this.level.shapes.map(s => s.element);
    const sequenceLength = Math.min(6, this.level.sequence.length);
    const randomSequence = generateSequence(sequenceLength, availableElements);
    this.targetSequence = randomSequence;
    this.encryptedSequence = encryptSequence(this.targetSequence);

    this.initializeRunePositions();
  }

  private initializeRunePositions(): void {
    this.runePositions.clear();
    const shuffledPositions = shuffleArray([...this.level.positions]);

    this.level.shapes.forEach((shape, index) => {
      const pos = shuffledPositions[index % shuffledPositions.length];
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = (Math.random() - 0.5) * 30;
      this.runePositions.set(shape.id, {
        x: pos.x + offsetX,
        y: pos.y + offsetY
      });
    });
  }

  on<T extends keyof EngineEvents>(event: T, callback: EngineEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off<T extends keyof EngineEvents>(event: T, callback: EngineEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit<T extends keyof EngineEvents>(event: T, data: Parameters<EngineEvents[T]>[0]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        (callback as (data: unknown) => void)(data);
      });
    }
  }

  placeRune(runeId: string, grooveId: string): boolean {
    if (this.state !== 'playing') return false;

    const rune = this.level.shapes.find(r => r.id === runeId);
    const groove = this.level.positions.find(g => g.id === grooveId);

    if (!rune || !groove) return false;

    const existingPlacement = this.placedRunes.get(grooveId);
    if (existingPlacement?.isLocked) return false;

    this.emit('pulseEffect', { grooveId });

    const expectedElement = this.targetSequence[this.currentStep];
    const isCorrect = rune.element === expectedElement;

    this.emit('runePlaced', {
      runeId,
      grooveId,
      element: rune.element,
      success: isCorrect
    });

    if (isCorrect) {
      this.placedRunes.set(grooveId, {
        runeId,
        grooveId,
        element: rune.element,
        isLocked: true,
        placedAt: Date.now()
      });

      this.activatedSequence.push(rune.element);
      this.currentStep++;

      this.emit('elementActivated', {
        element: rune.element,
        x: groove.x,
        y: groove.y
      });

      this.emit('progressUpdated', {
        current: this.currentStep,
        total: this.targetSequence.length
      });

      this.unlockedCombos.add(`${this.activatedSequence.join(',')}`);

      if (this.currentStep >= this.targetSequence.length) {
        this.state = 'completed';
        this.emit('waveEffect', undefined);
        setTimeout(() => {
          this.emit('levelCompleted', undefined);
        }, 800);
      } else {
        this.queueChainReaction();
      }

      return true;
    }

    return false;
  }

  private queueChainReaction(): void {
    this.chainReactionQueue.push(() => {
      this.triggerShuffle();
    });
    this.processChainQueue();
  }

  private processChainQueue(): void {
    if (this.chainReactionQueue.length > 0) {
      const reaction = this.chainReactionQueue.shift()!;
      setTimeout(() => {
        reaction();
        this.processChainQueue();
      }, 600);
    }
  }

  private triggerShuffle(): void {
    const unlockedGrooves = this.level.positions.filter(
      g => !this.placedRunes.get(g.id)?.isLocked
    );

    const shuffledPositions = shuffleArray([...unlockedGrooves]);

    this.emit('chainReaction', { positions: shuffledPositions });

    const availableRunes = this.level.shapes.filter(
      shape => !Array.from(this.placedRunes.values()).some(p => p.runeId === shape.id)
    );

    const newPositions = shuffleArray([...unlockedGrooves]);
    availableRunes.forEach((rune, index) => {
      const pos = newPositions[index % newPositions.length];
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      this.runePositions.set(rune.id, {
        x: pos.x + offsetX,
        y: pos.y + offsetY
      });
    });
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentStep,
      total: this.targetSequence.length
    };
  }

  getTargetSequence(): ElementType[] {
    return deepClone(this.targetSequence);
  }

  getEncryptedSequence(): string {
    return this.encryptedSequence;
  }

  getDecryptedSequence(): ElementType[] {
    return decryptSequence(this.encryptedSequence);
  }

  getState(): GameState {
    return this.state;
  }

  getLevel(): Level {
    return deepClone(this.level);
  }

  getPlacedRunes(): Map<string, PlacedRune> {
    return new Map(this.placedRunes);
  }

  getRunePosition(runeId: string): { x: number; y: number } | undefined {
    return this.runePositions.get(runeId);
  }

  getAllRunePositions(): Map<string, { x: number; y: number }> {
    return new Map(this.runePositions);
  }

  getCurrentStepElement(): ElementType | null {
    if (this.currentStep >= this.targetSequence.length) return null;
    return this.targetSequence[this.currentStep];
  }

  isRuneLocked(runeId: string): boolean {
    return Array.from(this.placedRunes.values()).some(p => p.runeId === runeId && p.isLocked);
  }

  getHint(): ElementType | null {
    return this.getCurrentStepElement();
  }

  resetLevel(): void {
    this.initializeLevel();
    this.emit('levelReset', undefined);
    this.emit('progressUpdated', { current: 0, total: this.targetSequence.length });
  }

  setLevel(level: Level): void {
    this.level = level;
    this.initializeLevel();
    this.emit('progressUpdated', { current: 0, total: this.targetSequence.length });
  }

  getUnlockedCombos(): string[] {
    return Array.from(this.unlockedCombos);
  }
}
