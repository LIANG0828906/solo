import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  projects as mockProjects,
  tracks as mockTracks,
  versions as mockVersions,
  comments as mockComments,
  collaborators as mockCollaborators,
} from '@/data/mockData';
import type {
  Project,
  Track,
  Version,
  Comment,
  Notification,
  TrackStatus,
  Collaborator,
} from '@/types';

interface ProjectState {
  projects: Project[];
  tracks: Record<string, Track>;
  versions: Record<string, Version>;
  comments: Record<string, Comment>;
  selectedProjectId: string | null;
  selectedTrackId: string | null;
  selectedVersionIds: [string | null, string | null];
  notifications: Notification[];
  currentUserId: string;
  activeMenu: string;
  currentUser: Collaborator;

  setActiveMenu: (id: string) => void;
  addProject: (data: {
    name: string;
    clientName: string;
    genres: string[];
    bpmRange: { min: number; max: number };
  }) => void;
  selectProject: (id: string | null) => void;
  selectTrack: (id: string | null) => void;
  selectVersionForCompare: (versionId: string, slot: 0 | 1) => void;
  addTrack: (projectId: string, data: { name: string; description: string }) => void;
  addVersion: (
    trackId: string,
    data: {
      uploader: string;
      uploaderId: string;
      note: string;
      audioUrl?: string;
      fileSize?: number;
    }
  ) => void;
  assignCollaborator: (projectId: string, trackId: string, collaboratorId: string) => void;
  markTrackComplete: (trackId: string) => void;
  updateTrackStatus: (trackId: string, status: TrackStatus) => void;
  addComment: (
    versionId: string,
    data: {
      author: string;
      authorId: string;
      content: string;
      emoji?: string;
      timestamp?: number;
    }
  ) => void;
  deleteComment: (commentId: string) => void;
  addCollaborator: (projectId: string, name: string) => void;
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  removeNotification: (id: string) => void;
  getProjectTracks: (projectId: string) => Track[];
  getTrackVersions: (trackId: string) => Version[];
  getVersionComments: (versionId: string) => Comment[];
  getProjectProgress: (projectId: string) => number;
  getNextVersionNumber: (trackId: string) => string;
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const tracksMap: Record<string, Track> = {};
mockTracks.forEach((t) => (tracksMap[t.id] = t));

const versionsMap: Record<string, Version> = {};
mockVersions.forEach((v) => (versionsMap[v.id] = v));

const commentsMap: Record<string, Comment> = {};
mockComments.forEach((c) => (commentsMap[c.id] = c));

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: mockProjects,
  tracks: tracksMap,
  versions: versionsMap,
  comments: commentsMap,
  selectedProjectId: null,
  selectedTrackId: null,
  selectedVersionIds: [null, null],
  notifications: [],
  currentUserId: mockCollaborators[0].id,
  activeMenu: 'projects',
  currentUser: mockCollaborators[0],

  setActiveMenu: (id) => set({ activeMenu: id }),
  addProject: (data) => {
    const newProject: Project = {
      id: uuidv4(),
      name: data.name,
      clientName: data.clientName,
      genres: data.genres,
      bpmRange: data.bpmRange,
      trackIds: [],
      collaborators: [],
      createdAt: new Date(),
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
  },

  selectProject: (id) => set({ selectedProjectId: id, selectedTrackId: null }),

  selectTrack: (id) => set({ selectedTrackId: id }),

  selectVersionForCompare: (versionId, slot) =>
    set((state) => {
      const newSelected: [string | null, string | null] = [
        ...state.selectedVersionIds,
      ] as [string | null, string | null];
      newSelected[slot] = versionId;
      return { selectedVersionIds: newSelected };
    }),

  addTrack: (projectId, data) => {
    const trackId = uuidv4();
    const newTrack: Track = {
      id: trackId,
      projectId,
      name: data.name,
      description: data.description,
      status: 'pending',
      versionIds: [],
      createdAt: new Date(),
    };
    set((state) => ({
      tracks: { ...state.tracks, [trackId]: newTrack },
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, trackIds: [...p.trackIds, trackId] } : p
      ),
    }));
  },

  addVersion: (trackId, data) => {
    const versionId = uuidv4();
    const version = get().getNextVersionNumber(trackId);
    const newVersion: Version = {
      id: versionId,
      trackId,
      version,
      uploader: data.uploader,
      uploaderId: data.uploaderId,
      uploadTime: new Date(),
      note: data.note,
      audioUrl: data.audioUrl ?? '',
      fileSize: data.fileSize ?? 0,
      commentIds: [],
    };
    set((state) => ({
      versions: { ...state.versions, [versionId]: newVersion },
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...state.tracks[trackId],
          versionIds: [...state.tracks[trackId].versionIds, versionId],
        },
      },
    }));
  },

  assignCollaborator: (projectId, trackId, collaboratorId) => {
    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: { ...state.tracks[trackId], assigneeId: collaboratorId },
      },
    }));
    const project = get().projects.find((p) => p.id === projectId);
    const collaborator = project?.collaborators.find((c) => c.id === collaboratorId);
    if (collaborator) {
      get().addNotification('success', `已指派 ${collaborator.name} 负责该曲目`);
    }
  },

  markTrackComplete: (trackId) => {
    set((state) => ({
      tracks: { ...state.tracks, [trackId]: { ...state.tracks[trackId], status: 'finalized' } },
    }));
  },

  updateTrackStatus: (trackId, status) => {
    set((state) => ({
      tracks: { ...state.tracks, [trackId]: { ...state.tracks[trackId], status } },
    }));
  },

  addComment: (versionId, data) => {
    const commentId = uuidv4();
    const newComment: Comment = {
      id: commentId,
      versionId,
      author: data.author,
      authorId: data.authorId,
      content: data.content,
      emoji: data.emoji,
      timestamp: data.timestamp ?? 0,
      createdAt: new Date(),
    };
    set((state) => ({
      comments: { ...state.comments, [commentId]: newComment },
      versions: {
        ...state.versions,
        [versionId]: {
          ...state.versions[versionId],
          commentIds: [...state.versions[versionId].commentIds, commentId],
        },
      },
    }));
  },

  deleteComment: (commentId) => {
    const comment = get().comments[commentId];
    if (!comment) return;
    set((state) => {
      const newComments = { ...state.comments };
      delete newComments[commentId];
      return {
        comments: newComments,
        versions: {
          ...state.versions,
          [comment.versionId]: {
            ...state.versions[comment.versionId],
            commentIds: state.versions[comment.versionId].commentIds.filter(
              (id) => id !== commentId
            ),
          },
        },
      };
    });
  },

  addCollaborator: (projectId, name) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        if (p.collaborators.length >= 5) return p;
        return {
          ...p,
          collaborators: [
            ...p.collaborators,
            { id: uuidv4(), name, color: randomColor() },
          ],
        };
      }),
    }));
  },

  addNotification: (type, message) => {
    const id = uuidv4();
    const notification: Notification = { id, type, message };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  getProjectTracks: (projectId) => {
    const state = get();
    return state.projects
      .find((p) => p.id === projectId)
      ?.trackIds.map((id) => state.tracks[id])
      .filter(Boolean) ?? [];
  },

  getTrackVersions: (trackId) => {
    const state = get();
    return (
      state.tracks[trackId]?.versionIds
        .map((id) => state.versions[id])
        .filter(Boolean) ?? []
    );
  },

  getVersionComments: (versionId) => {
    const state = get();
    return (
      state.versions[versionId]?.commentIds
        .map((id) => state.comments[id])
        .filter(Boolean) ?? []
    );
  },

  getProjectProgress: (projectId) => {
    const tracks = get().getProjectTracks(projectId);
    if (tracks.length === 0) return 0;
    const completed = tracks.filter((t) => t.status === 'finalized').length;
    return completed / tracks.length;
  },

  getNextVersionNumber: (trackId) => {
    const versions = get().getTrackVersions(trackId);
    if (versions.length === 0) return 'v1.0';
    const lastVersion = versions[versions.length - 1].version;
    const match = lastVersion.match(/^v(\d+)\.(\d+)$/);
    if (!match) return 'v1.0';
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return `v${major}.${minor + 1}`;
  },
}));
