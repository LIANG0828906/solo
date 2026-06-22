import { AtomType } from '@/types';

export interface BondRule {
  atom1: AtomType;
  atom2: AtomType;
  bondType: 'single' | 'double' | 'triple';
  bondDistance: number;
  maxRelativeSpeed: number;
  bondEnergy: number;
  maxBonds1: number;
  maxBonds2: number;
}

export class BondRules {
  private rules: BondRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.addRule('H', 'H', 'single', 18, 2, 436, 1, 1);
    this.addRule('H', 'O', 'single', 20, 2, 464, 1, 2);
    this.addRule('H', 'N', 'single', 19, 2, 391, 1, 3);
    this.addRule('H', 'C', 'single', 19, 2, 414, 1, 4);
    this.addRule('C', 'C', 'double', 15, 1, 614, 4, 4);
    this.addRule('C', 'C', 'single', 18, 2, 347, 4, 4);
    this.addRule('C', 'O', 'double', 16, 1, 745, 4, 2);
    this.addRule('C', 'O', 'single', 19, 2, 360, 4, 2);
    this.addRule('C', 'N', 'single', 19, 2, 305, 4, 3);
    this.addRule('N', 'N', 'triple', 12, 0.8, 941, 3, 3);
    this.addRule('N', 'N', 'single', 18, 2, 163, 3, 3);
    this.addRule('O', 'O', 'double', 14, 1, 498, 2, 2);
    this.addRule('O', 'O', 'single', 18, 2, 146, 2, 2);
    this.addRule('N', 'O', 'single', 19, 2, 222, 3, 2);
  }

  private addRule(
    atom1: AtomType,
    atom2: AtomType,
    bondType: 'single' | 'double' | 'triple',
    bondDistance: number,
    maxRelativeSpeed: number,
    bondEnergy: number,
    maxBonds1: number,
    maxBonds2: number,
  ): void {
    this.rules.push({
      atom1,
      atom2,
      bondType,
      bondDistance,
      maxRelativeSpeed,
      bondEnergy,
      maxBonds1,
      maxBonds2,
    });
    if (atom1 !== atom2) {
      this.rules.push({
        atom1: atom2,
        atom2: atom1,
        bondType,
        bondDistance,
        maxRelativeSpeed,
        bondEnergy,
        maxBonds1: maxBonds2,
        maxBonds2: maxBonds1,
      });
    }
  }

  public findBondRule(
    type1: AtomType,
    type2: AtomType,
    distance: number,
    relativeSpeed: number,
  ): BondRule | null {
    const matchingRules = this.rules.filter(
      (rule) =>
        rule.atom1 === type1 &&
        rule.atom2 === type2 &&
        distance <= rule.bondDistance &&
        relativeSpeed <= rule.maxRelativeSpeed,
    );

    if (matchingRules.length === 0) return null;

    matchingRules.sort((a, b) => {
      const aPriority = a.bondType === 'triple' ? 3 : a.bondType === 'double' ? 2 : 1;
      const bPriority = b.bondType === 'triple' ? 3 : b.bondType === 'double' ? 2 : 1;
      return bPriority - aPriority;
    });

    return matchingRules[0];
  }

  public getMaxBonds(atomType: AtomType): number {
    switch (atomType) {
      case 'H':
        return 1;
      case 'O':
        return 2;
      case 'N':
        return 3;
      case 'C':
        return 4;
      default:
        return 0;
    }
  }

  public getBondDistance(type1: AtomType, type2: AtomType): number {
    for (const rule of this.rules) {
      if (rule.atom1 === type1 && rule.atom2 === type2) {
        return rule.bondDistance;
      }
    }
    return 20;
  }
}
