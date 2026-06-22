import {
  WarpThread,
  WeftPick,
  Interlacement,
  HarnessState,
  HistoryEntry,
  LoomState,
  WARP_COUNT,
  HARNESS_COUNT,
  MAX_HISTORY,
  PRESET_COLORS
} from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function multiplyColors(color1: string, color2: string): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    (c1.r * c2.r) / 255,
    (c1.g * c2.g) / 255,
    (c1.b * c2.b) / 255
  );
}

export class LoomEngine {
  private state: LoomState;

  constructor() {
    this.state = this.initializeState();
  }

  private initializeState(): LoomState {
    const warps: WarpThread[] = [];
    const harnesses: HarnessState[] = [];

    for (let i = 0; i < HARNESS_COUNT; i++) {
      harnesses.push({
        id: i,
        isUp: false,
        warpIndices: []
      });
    }

    for (let i = 0; i < WARP_COUNT; i++) {
      const harnessId = i % HARNESS_COUNT;
      const isUp = Math.floor(i / 2) % 2 === 0;
      
      warps.push({
        id: i,
        color: '#8B4513',
        position: i,
        isUp: isUp,
        harnessId: harnessId
      });

      harnesses[harnessId].warpIndices.push(i);
      harnesses[harnessId].isUp = isUp;
    }

    return {
      warps,
      harnesses,
      weftPicks: [],
      currentWeftColor: PRESET_COLORS[0],
      pickDirection: 'right',
      history: []
    };
  }

  getState(): LoomState {
    return {
      ...this.state,
      warps: [...this.state.warps],
      harnesses: [...this.state.harnesses],
      weftPicks: [...this.state.weftPicks],
      history: [...this.state.history]
    };
  }

  setWeftColor(color: string): void {
    this.state.currentWeftColor = color;
  }

  toggleHarness(harnessId: number): void {
    const harness = this.state.harnesses[harnessId];
    if (harness) {
      harness.isUp = !harness.isUp;
      for (const warpIndex of harness.warpIndices) {
        this.state.warps[warpIndex].isUp = harness.isUp;
      }
    }
  }

  doPick(toggledHarnessId?: number): WeftPick | null {
    const harnessChanges: { id: number; wasUp: boolean }[] = [];

    if (toggledHarnessId !== undefined) {
      const harness = this.state.harnesses[toggledHarnessId];
      if (harness) {
        harnessChanges.push({
          id: toggledHarnessId,
          wasUp: !harness.isUp
        });
        this.toggleHarness(toggledHarnessId);
      }
    }

    const interlacements: Interlacement[] = [];
    const weftColor = this.state.currentWeftColor;

    for (let i = 0; i < WARP_COUNT; i++) {
      const warp = this.state.warps[i];
      const isWarpFaced = warp.isUp;
      const displayColor = isWarpFaced
        ? multiplyColors(warp.color, weftColor)
        : weftColor;

      interlacements.push({
        warpIndex: i,
        isWarpFaced,
        color: displayColor
      });
    }

    const weftPick: WeftPick = {
      id: this.state.weftPicks.length,
      color: weftColor,
      direction: this.state.pickDirection,
      interlacements
    };

    this.state.weftPicks.push(weftPick);

    const historyEntry: HistoryEntry = {
      harnessChanges,
      weftPick
    };

    this.state.history.push(historyEntry);
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.shift();
    }

    this.state.pickDirection = this.state.pickDirection === 'right' ? 'left' : 'right';

    return weftPick;
  }

  undoLastPick(): boolean {
    if (this.state.history.length === 0) {
      return false;
    }

    const lastEntry = this.state.history.pop()!;

    for (const change of lastEntry.harnessChanges) {
      const harness = this.state.harnesses[change.id];
      if (harness) {
        harness.isUp = change.wasUp;
        for (const warpIndex of harness.warpIndices) {
          this.state.warps[warpIndex].isUp = change.wasUp;
        }
      }
    }

    this.state.weftPicks.pop();
    this.state.pickDirection = this.state.pickDirection === 'right' ? 'left' : 'right';

    return true;
  }

  getHarnessState(harnessId: number): boolean {
    return this.state.harnesses[harnessId]?.isUp ?? false;
  }

  getAllHarnessStates(): boolean[] {
    return this.state.harnesses.map(h => h.isUp);
  }

  getWeftPicks(): WeftPick[] {
    return [...this.state.weftPicks];
  }

  canUndo(): boolean {
    return this.state.history.length > 0;
  }

  getHistoryCount(): number {
    return this.state.history.length;
  }

  reset(): void {
    this.state = this.initializeState();
  }
}
