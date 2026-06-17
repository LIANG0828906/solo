import { v4 as uuidv4 } from 'uuid';
import type {
  Tile,
  MatchTarget,
  ColorKey,
  IconKey,
  MatchType,
} from './types';
import {
  ALL_COLORS,
  ALL_ICONS,
  COLOR_LABEL,
  ICON_LABEL,
  getLevelConfig,
} from './types';
import type { GameStore } from './store';

const INITIAL_LIVES = 3;
const BASE_SCORE = 100;
const ROUNDS_PER_LEVEL = 5;
const COMBO_BONUS_EVERY = 5;

export class GameEngine {
  private store: GameStore;
  private rafId: number | null = null;
  private lastTime = 0;
  private roundTimeoutId: number | null = null;

  constructor(store: GameStore) {
    this.store = store;
  }

  startGame(): void {
    this.stopRaf();
    this.clearRoundTimeout();
    this.store._engineUpdate({
      score: 0,
      lives: INITIAL_LIVES,
      combo: 0,
      maxCombo: 0,
      round: 1,
      level: 1,
      phase: 'playing',
      shakeTrigger: 0,
    });
    this.startRound(1, 1, INITIAL_LIVES, 0, 0);
  }

  private startRound(
    round: number,
    level: number,
    lives: number,
    score: number,
    combo: number,
  ): void {
    const config = getLevelConfig(level);
    const availableColors = ALL_COLORS.slice(0, config.colorCount);
    const availableIcons = ALL_ICONS.slice(0, config.iconCount);

    const tiles = this.generateTiles(availableColors, availableIcons);
    const target = this.generateTarget(tiles, availableColors, availableIcons, config.allowBothMatch);

    this.store._engineUpdate({
      tiles,
      target,
      phase: 'playing',
      round,
      level,
      lives,
      score,
      combo,
      timeLeft: config.roundDuration,
      roundDuration: config.roundDuration,
    });

    this.startRaf();
  }

  private generateTiles(colors: ColorKey[], icons: IconKey[]): Tile[] {
    const tiles: Tile[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        tiles.push({
          id: uuidv4(),
          color: colors[Math.floor(Math.random() * colors.length)],
          icon: icons[Math.floor(Math.random() * icons.length)],
          row,
          col,
          state: 'idle',
        });
      }
    }
    return tiles;
  }

  private generateTarget(
    tiles: Tile[],
    colors: ColorKey[],
    icons: IconKey[],
    allowBoth: boolean,
  ): MatchTarget {
    const types: MatchType[] = allowBoth
      ? ['color', 'icon', 'both']
      : ['color', 'icon'];
    const type = types[Math.floor(Math.random() * types.length)];

    for (let attempts = 0; attempts < 50; attempts++) {
      let target: MatchTarget;
      if (type === 'color') {
        const color = colors[Math.floor(Math.random() * colors.length)];
        target = { type, color, description: `所有${COLOR_LABEL[color]}块` };
      } else if (type === 'icon') {
        const icon = icons[Math.floor(Math.random() * icons.length)];
        target = { type, icon, description: `所有${ICON_LABEL[icon]}块` };
      } else {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const icon = icons[Math.floor(Math.random() * icons.length)];
        target = {
          type,
          color,
          icon,
          description: `${COLOR_LABEL[color]}的${ICON_LABEL[icon]}`,
        };
      }
      const matchCount = tiles.filter((t) => this.isMatch(t, target)).length;
      if (matchCount >= 2 && matchCount <= 6) {
        return target;
      }
    }

    const fallbackColor = tiles[0].color;
    return {
      type: 'color',
      color: fallbackColor,
      description: `所有${COLOR_LABEL[fallbackColor]}块`,
    };
  }

  private isMatch(tile: Tile, target: MatchTarget): boolean {
    switch (target.type) {
      case 'color':
        return tile.color === target.color;
      case 'icon':
        return tile.icon === target.icon;
      case 'both':
        return tile.color === target.color && tile.icon === target.icon;
    }
  }

  handleTileSelect(tileId: string): void {
    const state = this.store.getState();
    if (state.phase !== 'playing') return;

    const tile = state.tiles.find((t) => t.id === tileId);
    if (!tile || tile.state === 'correct' || tile.state === 'wrong' || tile.state === 'matched') return;
    if (!state.target) return;

    const matched = this.isMatch(tile, state.target);

    if (matched) {
      const newCombo = state.combo + 1;
      const comboMultiplier = 1 + Math.floor(newCombo / COMBO_BONUS_EVERY);
      const scoreGain = BASE_SCORE * comboMultiplier;
      const newScore = state.score + scoreGain;
      const newMaxCombo = Math.max(state.maxCombo, newCombo);

      const newTiles = state.tiles.map((t) =>
        t.id === tileId ? { ...t, state: 'correct' as const } : t,
      );

      setTimeout(() => {
        const s = this.store.getState();
        const settled = s.tiles.map((t) =>
          t.id === tileId ? { ...t, state: 'matched' as const } : t,
        );
        const allMatched = settled.every((t) => {
          const shouldMatch = this.isMatch(t, s.target!);
          return !shouldMatch || t.state === 'matched';
        });
        this.store._engineUpdate({ tiles: settled });
        if (allMatched) {
          this.advanceRound();
        }
      }, 300);

      this.store._engineUpdate({
        tiles: newTiles,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
      });
    } else {
      const newLives = state.lives - 1;
      const wasCombo = state.combo > 0;
      const newShake = state.shakeTrigger + (wasCombo ? 1 : 0);

      const newTiles = state.tiles.map((t) =>
        t.id === tileId ? { ...t, state: 'wrong' as const } : t,
      );

      setTimeout(() => {
        const s = this.store.getState();
        const settled = s.tiles.map((t) =>
          t.id === tileId ? { ...t, state: 'idle' as const } : t,
        );
        this.store._engineUpdate({ tiles: settled });
      }, 200);

      this.store._engineUpdate({
        tiles: newTiles,
        lives: newLives,
        combo: 0,
        shakeTrigger: newShake,
      });

      if (newLives <= 0) {
        this.endGame();
      }
    }
  }

  private advanceRound(): void {
    this.stopRaf();
    const state = this.store.getState();
    const nextRound = state.round + 1;
    const nextLevel = Math.floor((nextRound - 1) / ROUNDS_PER_LEVEL) + 1;

    this.store._engineUpdate({ phase: 'round_end' });

    this.clearRoundTimeout();
    this.roundTimeoutId = window.setTimeout(() => {
      const s = this.store.getState();
      this.startRound(nextRound, nextLevel, s.lives, s.score, s.combo);
    }, 500);
  }

  private handleTimeout(): void {
    const state = this.store.getState();
    if (state.phase !== 'playing' || !state.target) return;

    const missed = state.tiles.filter(
      (t) => this.isMatch(t, state.target!) && t.state !== 'matched',
    ).length;

    if (missed > 0) {
      const newLives = Math.max(0, state.lives - 1);
      this.store._engineUpdate({
        lives: newLives,
        combo: 0,
        shakeTrigger: state.shakeTrigger + 1,
      });

      if (newLives <= 0) {
        this.endGame();
        return;
      }
    }
    this.advanceRound();
  }

  private endGame(): void {
    this.stopRaf();
    this.clearRoundTimeout();
    this.store._engineUpdate({ phase: 'game_over' });
  }

  private startRaf(): void {
    this.stopRaf();
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.tick(delta);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private clearRoundTimeout(): void {
    if (this.roundTimeoutId !== null) {
      clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
  }

  private tick(delta: number): void {
    const state = this.store.getState();
    if (state.phase !== 'playing') return;

    const newTime = Math.max(0, state.timeLeft - delta);
    this.store._engineUpdate({ timeLeft: newTime });

    if (newTime <= 0) {
      this.handleTimeout();
    }
  }

  destroy(): void {
    this.stopRaf();
    this.clearRoundTimeout();
  }
}

export const createEngine = (store: GameStore): GameEngine => {
  return new GameEngine(store);
};
