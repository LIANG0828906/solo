import type { CollectedPart, RepairSlot, PartType, SlotRegion } from '../../store/types';
import { useGameStore, createPart } from '../../store/gameStore';

export class ShipRepair {
  public getCollectedParts(): CollectedPart[] {
    return useGameStore.getState().collectedParts;
  }

  public getRepairSlots(): RepairSlot[] {
    return useGameStore.getState().repairSlots;
  }

  public getSlotsByRegion(region: SlotRegion): RepairSlot[] {
    return this.getRepairSlots().filter((slot) => slot.region === region);
  }

  public getProgress(): { filled: number; total: number; percentage: number } {
    const slots = this.getRepairSlots();
    const filled = slots.filter((s) => s.filled).length;
    const total = slots.length;
    return {
      filled,
      total,
      percentage: total > 0 ? (filled / total) * 100 : 0,
    };
  }

  public isEngineStarted(): boolean {
    return useGameStore.getState().engineStarted;
  }

  public isRepairComplete(): boolean {
    return useGameStore.getState().checkRepairComplete();
  }

  public canPartFillSlot(part: CollectedPart, slot: RepairSlot): boolean {
    if (slot.filled) return false;
    return part.type === slot.requiredType;
  }

  public findMatchingSlot(part: CollectedPart): RepairSlot | null {
    const slots = this.getRepairSlots();
    return slots.find((slot) => this.canPartFillSlot(part, slot)) || null;
  }

  public getPartsOfType(type: PartType): CollectedPart[] {
    return this.getCollectedParts().filter((p) => p.type === type);
  }

  public getRequiredPartTypes(): Map<PartType, { required: number; have: number }> {
    const result = new Map<PartType, { required: number; have: number }>();
    const slots = this.getRepairSlots();

    for (const slot of slots) {
      const current = result.get(slot.requiredType) || { required: 0, have: 0 };
      if (!slot.filled) {
        current.required++;
      }
      result.set(slot.requiredType, current);
    }

    const parts = this.getCollectedParts();
    for (const part of parts) {
      const current = result.get(part.type) || { required: 0, have: 0 };
      current.have++;
      result.set(part.type, current);
    }

    return result;
  }

  public placePartInSlot(partId: string, slotId: string): boolean {
    const state = useGameStore.getState();
    const part = state.collectedParts.find((p) => p.id === partId);
    const slot = state.repairSlots.find((s) => s.id === slotId);

    if (!part || !slot) return false;
    if (!this.canPartFillSlot(part, slot)) return false;

    state.fillRepairSlot(slotId, part);
    return true;
  }

  public startEngine(): boolean {
    if (!this.isRepairComplete()) {
      useGameStore.getState().addEvent('无法启动引擎：尚有部件未安装！', 'warning');
      return false;
    }
    if (this.isEngineStarted()) {
      useGameStore.getState().addEvent('引擎已经启动。', 'info');
      return false;
    }

    useGameStore.getState().setEngineStarted(true);
    useGameStore.getState().addEvent('🚀 引擎启动成功！深度计已解锁，可以开始下潜了。', 'success');
    return true;
  }

  public enterDivingMode(): boolean {
    if (!this.isEngineStarted()) {
      useGameStore.getState().addEvent('请先启动引擎！', 'warning');
      return false;
    }
    useGameStore.getState().setGameView('diving');
    useGameStore.getState().setGamePhase('diving');
    useGameStore.getState().addEvent('🌊 进入下潜模式！按W/S或方向键控制上浮/下潜。', 'info');
    return true;
  }

  public returnToMap(): void {
    useGameStore.getState().setGameView('map');
    useGameStore.getState().setGamePhase('exploring');
    useGameStore.getState().addEvent('返回海面探索模式。', 'info');
  }

  public grantBonusPart(type?: PartType): void {
    const types: PartType[] = ['pipe_fragment', 'valve', 'engine_piece', 'hull_plate', 'circuit_board', 'battery'];
    const selectedType = type || types[Math.floor(Math.random() * types.length)];
    const part = createPart(selectedType);
    useGameStore.getState().addCollectedPart(part);
  }
}

export const shipRepair = new ShipRepair();
