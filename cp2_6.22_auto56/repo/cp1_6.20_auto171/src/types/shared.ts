export interface Platform { id: string; type: 'platform'; x: number; y: number; width: number; height: number }
export interface Spike { id: string; type: 'spike'; x: number; y: number; size: number; rotation: 0|45|90|135|180|225|270|315 }
export interface PlayerStart { x: number; y: number }
export interface JumpParams { vx: number; vy: number }
export const PHYSICS = { GRAVITY: 1200, DT: 1/60, MAX_T: 5, POINT_SPACING: 10 } as const
export interface LevelState { platforms: Platform[]; spikes: Spike[]; playerStart: PlayerStart; jumpParams: JumpParams; canvasWidth: number; canvasHeight: number }
export interface TemplateMeta { id: string; name: string; createdAt: number }
export interface LevelTemplate extends TemplateMeta { level: LevelState }
export interface TrajectoryPoint { x: number; y: number; t: number; vx: number; vy: number }
export interface HazardZone { id: string; type: 'spike_hit'|'out_of_bounds'; startIndex: number; endIndex: number; collisionX: number; collisionY: number; elementId?: string }
export type ToolMode = 'select'|'place_platform'|'place_spike'|'delete';
export type SelectionTarget = { type:'platform'|'spike'; id: string } | null;
export type DragState =
  | null
  | { kind:'player_start'; offsetX:number; offsetY:number }
  | { kind:'element'; target:SelectionTarget; offsetX:number; offsetY:number }
  | { kind:'resize_platform'; id:string; handle:'se'|'sw'|'ne'|'nw'|'n'|'s'|'e'|'w'; origX:number; origY:number; origW:number; origH:number }
  | { kind:'place_preview'; }
