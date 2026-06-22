import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Track, Clip, Sample, Collaborator, CollabOperation } from '../types';

interface ProjectState {
  project: Project;
  currentUserId: string;
  selectedTrackId: string | null;
  selectedClipId: string | null;
  playhead: number;
  isPlaying: boolean;
  zoom: number;
  scrollLeft: number;
  setProject: (project: Project) => void;
  setSelectedTrackId: (id: string | null) => void;
  setSelectedClipId: (id: string | null) => void;
  setPlayhead: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setScrollLeft: (scroll: number) => void;
  addTrack: () => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  addClip: (clip: Omit<Clip, 'id'>) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  addSample: (sample: Sample) => void;
  addCollaborator: (user: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  updateCollaboratorCursor: (userId: string, cursor: { x: number; y: number } | null) => void;
  applyOperation: (operation: CollabOperation) => void;
}

const TRACK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const generateTrackName = (index: number) => `音轨 ${index + 1}`;

const createInitialProject = (): Project => {
  const tracks: Track[] = Array.from({ length: 4 }, (_, i) => ({
    id: uuidv4(),
    name: generateTrackName(i),
    color: TRACK_COLORS[i % TRACK_COLORS.length],
    volume: 0.8,
    muted: false,
    solo: false,
  }));

  return {
    id: 'project-default',
    name: '未命名项目',
    tracks,
    clips: [],
    samples: [],
    collaborators: [],
  };
};

const getCurrentUserId = (): string => {
  let userId = localStorage.getItem('audio_collab_user_id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('audio_collab_user_id', userId);
  }
  return userId;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createInitialProject(),
  currentUserId: getCurrentUserId(),
  selectedTrackId: null,
  selectedClipId: null,
  playhead: 0,
  isPlaying: false,
  zoom: 1,
  scrollLeft: 0,

  setProject: (project) => set({ project }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setPlayhead: (time) => set({ playhead: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom }),
  setScrollLeft: (scroll) => set({ scrollLeft: scroll }),

  addTrack: () => {
    const { project } = get();
    const newTrack: Track = {
      id: uuidv4(),
      name: generateTrackName(project.tracks.length),
      color: TRACK_COLORS[project.tracks.length % TRACK_COLORS.length],
      volume: 0.8,
      muted: false,
      solo: false,
    };
    set({
      project: {
        ...project,
        tracks: [...project.tracks, newTrack],
      },
    });
  },

  updateTrack: (id, updates) => {
    const { project } = get();
    set({
      project: {
        ...project,
        tracks: project.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      },
    });
  },

  addClip: (clip) => {
    const { project } = get();
    const newClip: Clip = {
      ...clip,
      id: uuidv4(),
    };
    set({
      project: {
        ...project,
        clips: [...project.clips, newClip],
      },
    });
  },

  updateClip: (id, updates) => {
    const { project } = get();
    set({
      project: {
        ...project,
        clips: project.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    });
  },

  deleteClip: (id) => {
    const { project } = get();
    set({
      project: {
        ...project,
        clips: project.clips.filter((c) => c.id !== id),
      },
      selectedClipId: get().selectedClipId === id ? null : get().selectedClipId,
    });
  },

  addSample: (sample) => {
    const { project } = get();
    set({
      project: {
        ...project,
        samples: [...project.samples, sample],
      },
    });
  },

  addCollaborator: (user) => {
    const { project } = get();
    const exists = project.collaborators.find((c) => c.id === user.id);
    if (!exists) {
      set({
        project: {
          ...project,
          collaborators: [...project.collaborators, user],
        },
      });
    }
  },

  removeCollaborator: (userId) => {
    const { project } = get();
    set({
      project: {
        ...project,
        collaborators: project.collaborators.filter((c) => c.id !== userId),
      },
    });
  },

  updateCollaboratorCursor: (userId, cursor) => {
    const { project } = get();
    set({
      project: {
        ...project,
        collaborators: project.collaborators.map((c) =>
          c.id === userId ? { ...c, cursor } : c
        ),
      },
    });
  },

  applyOperation: (operation) => {
    const { type, payload } = operation;
    const { project, currentUserId } = get();

    if (operation.userId === currentUserId) return;

    switch (type) {
      case 'clip-add':
        set({
          project: {
            ...project,
            clips: [...project.clips, payload],
          },
        });
        break;
      case 'clip-move':
      case 'clip-update':
        set({
          project: {
            ...project,
            clips: project.clips.map((c) =>
              c.id === payload.id ? { ...c, ...payload.updates } : c
            ),
          },
        });
        break;
      case 'clip-delete':
        set({
          project: {
            ...project,
            clips: project.clips.filter((c) => c.id !== payload.id),
          },
        });
        break;
      case 'track-add':
        set({
          project: {
            ...project,
            tracks: [...project.tracks, payload],
          },
        });
        break;
      case 'track-update':
        set({
          project: {
            ...project,
            tracks: project.tracks.map((t) =>
              t.id === payload.id ? { ...t, ...payload.updates } : t
            ),
          },
        });
        break;
      case 'cursor-move':
        set({
          project: {
            ...project,
            collaborators: project.collaborators.map((c) =>
              c.id === operation.userId ? { ...c, cursor: payload.cursor } : c
            ),
          },
        });
        break;
    }
  },
}));
