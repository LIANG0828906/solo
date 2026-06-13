export type {
  PlayerId,
  TerrainType,
  UnitType,
  GamePhase,
  Position,
  TerrainCell,
  Unit,
  ResourcePoint,
  Base,
  PlayerState,
  LogEntry,
  GameState,
  GameAction,
  ActionResult,
  DeployAction,
  TerrainEffect,
  UnitConfig,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../../shared/types';

export interface AnimationState {
  type: 'attack_rush' | 'hit_flash' | 'damage_number' | 'death_shatter' | 'select_pulse' | 'move_highlight';
  unitId?: string;
  position?: Position;
  startTime: number;
  duration: number;
  damage?: number;
  isEnemy?: boolean;
  fromPosition?: Position;
}

export interface TooltipInfo {
  terrain: TerrainType;
  position: Position;
  visible: boolean;
}
