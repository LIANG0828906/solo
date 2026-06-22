export interface Project {
  id: string;
  name: string;
  key: string;
  bpm: number;
  instruments: string[];
  joinCode: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  measure: number;
  beat: number;
  pitch: number;
  duration: number;
  instrument: string;
}

export interface ProjectDetail extends Project {
  notes: Note[];
}

export interface Version {
  id: string;
  projectId: string;
  name: string;
  snapshot: Note[];
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface RoomMember {
  socketId: string;
  userId: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
}
