export type NodeType = 'oscillator' | 'player' | 'gain' | 'reverb' | 'delay' | 'output';

export interface NodeParams {
  waveform?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  frequency?: number;
  volume?: number;
  reverbTime?: number;
  delayTime?: number;
  feedback?: number;
  playbackRate?: number;
}

export interface AudioNodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  params: NodeParams;
  lastEditor?: string;
}

export interface ConnectionData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface UserData {
  id: string;
  name: string;
}

export interface RoomState {
  roomCode: string;
  users: UserData[];
  nodes: AudioNodeData[];
  connections: ConnectionData[];
}

export type WSMessage =
  | { type: 'join'; roomCode: string; userName: string }
  | { type: 'joined'; roomCode: string; users: UserData[]; state: RoomState }
  | { type: 'user_joined'; user: UserData }
  | { type: 'user_left'; userId: string }
  | { type: 'add_node'; node: AudioNodeData }
  | { type: 'move_node'; nodeId: string; x: number; y: number }
  | { type: 'update_params'; nodeId: string; params: NodeParams; editorName: string }
  | { type: 'add_connection'; connection: ConnectionData }
  | { type: 'remove_node'; nodeId: string }
  | { type: 'remove_connection'; connectionId: string }
  | { type: 'room_full' }
  | { type: 'error'; message: string };

export const NODE_COLORS: Record<NodeType, string> = {
  oscillator: '#FF6B35',
  player: '#004E89',
  gain: '#1A936F',
  reverb: '#FFA630',
  delay: '#D81159',
  output: '#6B4E71'
};

export const NODE_LABELS: Record<NodeType, string> = {
  oscillator: '振荡器',
  player: '播放器',
  gain: '增益器',
  reverb: '混响器',
  delay: '延迟器',
  output: '输出'
};

export const NODE_RADIUS = 40;
