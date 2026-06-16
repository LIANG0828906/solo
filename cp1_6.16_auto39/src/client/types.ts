export interface AudioClip {
  id: string;
  name: string;
  audioId: string;
  fileName: string;
  startTime: number;
  endTime: number;
  duration: number;
  url?: string;
}

export interface TrackClip {
  id: string;
  clipId: string;
  clipName: string;
  fileName: string;
  audioId: string;
  startTime: number;
  endTime: number;
  trackStartTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  color: string;
}

export interface Track {
  id: number;
  name: string;
  color: string;
  volume: number;
  clips: TrackClip[];
}

export interface ProjectData {
  version: string;
  createdAt: string;
  tracks: Track[];
  clips: AudioClip[];
  totalDuration: number;
}
