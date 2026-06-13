export interface LightConfig {
  id: number
  color: string
  brightness: number
  colorTemp: number
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}

export interface ViewConfig {
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
}

export interface RoomState {
  roomCode: string
  lights: LightConfig[]
  viewers: ViewerInfo[]
  createdAt: number
}

export interface ViewerInfo {
  id: string
  name: string
  role: 'artist' | 'viewer'
  joinedAt: number
  lastActive: number
}

export enum SocketEvent {
  JOIN_ROOM = 'joinRoom',
  LEAVE_ROOM = 'leaveRoom',
  ROOM_JOINED = 'roomJoined',
  ROOM_LEFT = 'roomLeft',
  ROOM_STATE = 'roomState',
  LIGHT_UPDATE = 'lightUpdate',
  LIGHT_BROADCAST = 'lightBroadcast',
  VIEW_UPDATE = 'viewUpdate',
  VIEW_BROADCAST = 'viewBroadcast',
  PRESET_APPLY = 'presetApply',
  PRESET_BROADCAST = 'presetBroadcast',
  VIEWERS_UPDATE = 'viewersUpdate',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

export type PresetType = 'warmDusk' | 'coolTech' | 'softMorning'

export const PRESET_COLORS: string[] = [
  '#FF4D4F', '#FF7A45', '#FAAD14', '#52C41A',
  '#13C2C2', '#1890FF', '#722ED1', '#EB2F96',
  '#FF0000', '#00FF00', '#0000FF', '#FFFFFF'
]

export const LIGHT_POSITIONS: Array<{
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}> = [
  { position: { x: -5, y: 6, z: -5 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: 5, y: 6, z: -5 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: -5, y: 6, z: 5 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: 5, y: 6, z: 5 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: 0, y: 8, z: 0 }, target: { x: 0, y: 0, z: 0 } }
]

export const DEFAULT_LIGHTS: LightConfig[] = LIGHT_POSITIONS.map((pos, idx) => ({
  id: idx,
  color: PRESET_COLORS[idx % PRESET_COLORS.length],
  brightness: 50,
  colorTemp: 4500,
  position: pos.position,
  target: pos.target
}))
