import { RuneDefinition, RuneType, MatchResult, SpellCastEvent } from './rune-system';

export interface PlayerState {
  mana: number;
  maxMana: number;
  selectedRuneId: RuneType | null;
  score: number;
  combo: number;
  lastCastTime: Map<RuneType, number>;
}

export interface PlayerEvents {
  onSpellCast?: (event: SpellCastEvent) => void;
  onScoreChange?: (score: number, delta: number) => void;
  onManaChange?: (mana: number) => void;
  onComboChange?: (combo: number) => void;
}

const MANA_REGEN_PER_SECOND = 5;
const COMBO_BONUS_PER_STACK = 0.1;

interface RuneCooldownEntry {
  castTime: number;
  cooldownMs: number;
}

export class Player {
  private state: PlayerState;
  private events: PlayerEvents;
  private runeCooldowns: Map<RuneType, RuneCooldownEntry>;

  constructor(events?: PlayerEvents) {
    this.state = {
      mana: 100,
      maxMana: 100,
      selectedRuneId: null,
      score: 0,
      combo: 0,
      lastCastTime: new Map<RuneType, number>(),
    };
    this.events = events ?? {};
    this.runeCooldowns = new Map<RuneType, RuneCooldownEntry>();
  }

  getState(): Readonly<PlayerState> {
    return this.state;
  }

  canCastRune(rune: RuneDefinition, now: number): boolean {
    if (this.state.mana < rune.manaCost) {
      return false;
    }
    const entry = this.runeCooldowns.get(rune.id);
    if (entry !== undefined && now - entry.castTime < entry.cooldownMs) {
      return false;
    }
    return true;
  }

  castSpell(matchResult: MatchResult, now: number): SpellCastEvent | null {
    if (!matchResult.matched || !matchResult.runeId || !matchResult.matchedRune) {
      return null;
    }

    const rune = matchResult.matchedRune;

    if (!this.canCastRune(rune, now)) {
      return null;
    }

    const damage = Math.round(rune.damage * matchResult.damageMultiplier);
    const manaCost = rune.manaCost;

    this.state.mana -= manaCost;
    this.state.mana = Math.max(0, this.state.mana);
    this.events.onManaChange?.(this.state.mana);

    this.runeCooldowns.set(rune.id, {
      castTime: now,
      cooldownMs: rune.cooldown,
    });
    this.state.lastCastTime.set(rune.id, now);

    this.state.combo += 1;
    this.events.onComboChange?.(this.state.combo);

    const event: SpellCastEvent = {
      runeId: rune.id,
      rune,
      damage,
      accuracy: matchResult.accuracy,
      speedFactor: matchResult.speedFactor,
      similarity: matchResult.similarity,
      timestamp: now,
      manaCost,
      combo: this.state.combo,
    };

    this.events.onSpellCast?.(event);

    return event;
  }

  addScore(delta: number): void {
    const comboMultiplier = 1 + this.state.combo * COMBO_BONUS_PER_STACK;
    const finalDelta = Math.round(delta * comboMultiplier);
    this.state.score += finalDelta;
    this.state.score = Math.max(0, this.state.score);
    this.events.onScoreChange?.(this.state.score, finalDelta);
  }

  regenMana(deltaTime: number): void {
    const regenAmount = MANA_REGEN_PER_SECOND * deltaTime;
    this.state.mana = Math.min(this.state.maxMana, this.state.mana + regenAmount);
    this.events.onManaChange?.(this.state.mana);
  }

  updateCooldowns(now: number): void {
    for (const [runeId, entry] of this.runeCooldowns.entries()) {
      if (now - entry.castTime >= entry.cooldownMs) {
        this.runeCooldowns.delete(runeId);
      }
    }
  }

  resetCombo(): void {
    if (this.state.combo !== 0) {
      this.state.combo = 0;
      this.events.onComboChange?.(this.state.combo);
    }
  }

  getCooldownPercent(runeId: RuneType, now: number): number {
    const entry = this.runeCooldowns.get(runeId);
    if (entry === undefined) {
      return 1;
    }
    const elapsed = now - entry.castTime;
    if (elapsed >= entry.cooldownMs) {
      return 1;
    }
    return elapsed / entry.cooldownMs;
  }
}
