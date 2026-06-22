import {
  AltarSlot,
  RuneShard,
  RuneType,
  CombinationFormula,
  COMBINATION_FORMULAS,
} from '../types';

export interface AltarResult {
  success: boolean;
  formula: CombinationFormula | null;
  matchedSlotIds: number[];
}

export class RuneAltar {
  slots: AltarSlot[];
  onActivate: ((formula: CombinationFormula, slotIds: number[]) => void) | null = null;

  constructor(slotCount: number = 2) {
    this.slots = [];
    for (let i = 0; i < slotCount; i++) {
      this.slots.push({ id: i, shard: null });
    }
  }

  insertShard(slotId: number, shard: RuneShard): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || slot.shard !== null) return false;
    slot.shard = shard;
    return true;
  }

  removeShardFromSlot(slotId: number): RuneShard | null {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || !slot.shard) return null;
    const shard = slot.shard;
    slot.shard = null;
    return shard;
  }

  clearAllSlots(): RuneShard[] {
    const shards: RuneShard[] = [];
    for (const slot of this.slots) {
      if (slot.shard) {
        shards.push(slot.shard);
        slot.shard = null;
      }
    }
    return shards;
  }

  checkCombination(): AltarResult {
    const filledSlots = this.slots.filter(s => s.shard !== null);
    if (filledSlots.length < 2) {
      return { success: false, formula: null, matchedSlotIds: [] };
    }

    const inputTypes: RuneType[] = filledSlots.map(s => s.shard!.type);
    const slotIds = filledSlots.map(s => s.id);

    for (const formula of COMBINATION_FORMULAS) {
      if (this._matchesFormula(inputTypes, formula.inputs)) {
        return {
          success: true,
          formula,
          matchedSlotIds: slotIds,
        };
      }
    }

    return { success: false, formula: null, matchedSlotIds: [] };
  }

  private _matchesFormula(inputs: RuneType[], formula: RuneType[]): boolean {
    if (inputs.length !== formula.length) return false;
    const sortedInput = [...inputs].sort();
    const sortedFormula = [...formula].sort();
    return sortedInput.every((t, i) => t === sortedFormula[i]);
  }

  activate(): AltarResult {
    const result = this.checkCombination();
    if (result.success && result.formula && this.onActivate) {
      this.onActivate(result.formula, result.matchedSlotIds);
      for (const slot of this.slots) {
        slot.shard = null;
      }
    }
    return result;
  }

  getEmptySlotId(): number | null {
    const empty = this.slots.find(s => s.shard === null);
    return empty ? empty.id : null;
  }
}
