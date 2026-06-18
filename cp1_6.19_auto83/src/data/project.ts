export type InstrumentType = 'piano' | 'guitar' | 'drums' | 'bass';

export interface Note {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
  createdAt: number;
  createdBy: string;
  highlighted?: boolean;
  isNew?: boolean;
}

export interface Track {
  id: string;
  name: string;
  instrument: InstrumentType;
  color: string;
  notes: Note[];
  volume: number;
  muted: boolean;
}

export interface OnlineUser {
  id: string;
  name: string;
  color: string;
  lastActive: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  bpm: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ProjectData {
  meta: ProjectMeta;
  tracks: Track[];
  onlineUsers: OnlineUser[];
}

export const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  piano: '#F4D03F',
  guitar: '#E67E22',
  drums: '#C0392B',
  bass: '#8E44AD'
};

export const INSTRUMENT_NAMES: Record<InstrumentType, string> = {
  piano: '钢琴',
  guitar: '电吉他',
  drums: '鼓',
  bass: '贝斯'
};

export const AVAILABLE_INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'drums', 'bass'];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = midi % 12;
  return `${NOTE_NAMES[note]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const RANDOM_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'
];

export function getRandomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

export function createDefaultTrack(
  instrument: InstrumentType,
  index: number
): Track {
  return {
    id: generateId(),
    name: `${INSTRUMENT_NAMES[instrument]} ${index + 1}`,
    instrument,
    color: INSTRUMENT_COLORS[instrument],
    notes: [],
    volume: 0.8,
    muted: false
  };
}

export function createDefaultProject(userId: string): ProjectData {
  const now = Date.now();
  return {
    meta: {
      id: generateId(),
      name: '未命名项目',
      bpm: 120,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    },
    tracks: [
      createDefaultTrack('piano', 0),
      createDefaultTrack('drums', 1)
    ],
    onlineUsers: []
  };
}

export function serializeProject(project: ProjectData): string {
  return JSON.stringify(project, null, 2);
}

export function deserializeProject(data: string): ProjectData | null {
  try {
    return JSON.parse(data) as ProjectData;
  } catch {
    return null;
  }
}

export function cloneProject(project: ProjectData): ProjectData {
  return JSON.parse(JSON.stringify(project));
}

export function exportProjectJSON(project: ProjectData): string {
  const exportData = {
    meta: project.meta,
    tracks: project.tracks.map(t => ({
      id: t.id,
      name: t.name,
      instrument: t.instrument,
      notes: t.notes.map(n => ({
        id: n.id,
        pitch: n.pitch,
        start: n.start,
        duration: n.duration,
        velocity: n.velocity
      }))
    })),
    exportTime: Date.now()
  };
  return JSON.stringify(exportData, null, 2);
}

export function findTrackById(project: ProjectData, trackId: string): Track | undefined {
  return project.tracks.find(t => t.id === trackId);
}

export function findNoteById(
  track: Track,
  noteId: string
): Note | undefined {
  return track.notes.find(n => n.id === noteId);
}

export const QUARTER_NOTE_WIDTH = 40;
export const MIN_PITCH = 36;
export const MAX_PITCH = 84;
export const TOTAL_PITCHES = MAX_PITCH - MIN_PITCH + 1;
export const STAFF_LINE_SPACING = 12;
export const GRID_VISIBLE_BARS = 16;
