export type TrapType = 'spike' | 'boulder' | 'poison' | 'blade';

export interface TrapParams {
  triggerRadius: number;
  damage: number;
  duration: number;
}

export interface TrapDefinition {
  type: TrapType;
  label: string;
  defaultParams: TrapParams;
}

export const TRAP_DEFINITIONS: TrapDefinition[] = [
  { type: 'spike', label: '尖刺', defaultParams: { triggerRadius: 1.5, damage: 5, duration: 2 } },
  { type: 'boulder', label: '落石', defaultParams: { triggerRadius: 2.0, damage: 8, duration: 3 } },
  { type: 'poison', label: '毒气', defaultParams: { triggerRadius: 2.5, damage: 3, duration: 4 } },
  { type: 'blade', label: '旋转刀片', defaultParams: { triggerRadius: 1.8, damage: 6, duration: 2 } },
];

export const DEFAULT_TRAP_TYPE: TrapType = 'spike';

export function getDefaultParams(type: TrapType): TrapParams {
  const def = TRAP_DEFINITIONS.find(d => d.type === type);
  return def ? { ...def.defaultParams } : { triggerRadius: 1.5, damage: 5, duration: 2 };
}

export type TrapState = 'standby' | 'triggered' | 'cooldown';

export interface DebugInfo {
  collisionBox: { x: number; y: number; z: number; width: number; height: number; depth: number };
  damageRange: number;
  state: TrapState;
}
