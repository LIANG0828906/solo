export interface KeyframeProperties {
  transform: string;
  opacity: number;
  filter: string;
  borderRadius: number;
}

export interface Keyframe {
  id: string;
  percent: number;
  properties: KeyframeProperties;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  keyframes: Keyframe[];
  thumbnail: string;
}

export interface ShareRequest {
  hash: string;
  keyframes: Keyframe[];
  createdAt: number;
}

export interface ShareResponse {
  hash: string;
  url: string;
  keyframes: Keyframe[];
}
