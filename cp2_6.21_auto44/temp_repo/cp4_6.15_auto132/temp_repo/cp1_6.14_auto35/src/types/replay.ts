export interface ReplayMeta {
  id: string;
  name: string;
  createdAt: string;
  teamLevel: number;
  teamComposition: string[];
}

export interface UnitState {
  id: string;
  name: string;
  team: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  actionPoints: number;
  position: { x: number; y: number; z: number };
}

export interface ActionRecord {
  type: 'move' | 'attack' | 'spell' | 'item';
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  description: string;
  from?: { x: number; y: number; z: number };
  to?: { x: number; y: number; z: number };
  damage?: number;
  healAmount?: number;
  spellName?: string;
  itemName?: string;
}

export interface BattleFrame {
  timestamp: number;
  units: UnitState[];
  actions: ActionRecord[];
}

export interface BattleLog {
  id: string;
  name: string;
  frames: BattleFrame[];
}
