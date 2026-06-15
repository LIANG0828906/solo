import { Part, PartStats, AssembledMech, PartType } from '../types';
import { PARTS, STAT_WEIGHTS } from '../data/parts';

export class AssemblyLogic {
  private selectedParts: Record<PartType, Part | null> = {
    head: null,
    torso: null,
    arms: null,
    legs: null
  };

  constructor() {
    this.selectedParts.head = PARTS.head[0];
    this.selectedParts.torso = PARTS.torso[0];
    this.selectedParts.arms = PARTS.arms[0];
    this.selectedParts.legs = PARTS.legs[0];
  }

  selectPart(type: PartType, partId: string): Part | null {
    const part = PARTS[type].find(p => p.id === partId);
    if (part) {
      this.selectedParts[type] = part;
      return part;
    }
    return null;
  }

  getSelectedPart(type: PartType): Part | null {
    return this.selectedParts[type];
  }

  getAllParts(): Record<PartType, Part | null> {
    return { ...this.selectedParts };
  }

  calculateTotalStats(): PartStats {
    const stats: PartStats = { attack: 0, defense: 0, speed: 0, energy: 0 };
    const parts = Object.values(this.selectedParts).filter(Boolean) as Part[];
    for (const part of parts) {
      stats.attack += part.stats.attack;
      stats.defense += part.stats.defense;
      stats.speed += part.stats.speed;
      stats.energy += part.stats.energy;
    }
    return stats;
  }

  calculatePowerScore(stats: PartStats): number {
    return Math.round(
      stats.attack * STAT_WEIGHTS.attack +
      stats.defense * STAT_WEIGHTS.defense +
      stats.speed * STAT_WEIGHTS.speed +
      stats.energy * STAT_WEIGHTS.energy
    );
  }

  getAssembledMech(): AssembledMech {
    const totalStats = this.calculateTotalStats();
    const powerScore = this.calculatePowerScore(totalStats);
    return {
      head: this.selectedParts.head!,
      torso: this.selectedParts.torso!,
      arms: this.selectedParts.arms!,
      legs: this.selectedParts.legs!,
      totalStats,
      powerScore
    };
  }
}
