import { create } from 'zustand';
import type { DocDocument, OnlineUser, VersionSnapshot } from '../../shared/types';

interface DocStore {
  documents: DocDocument[];
  activeDocId: string | null;
  onlineUsers: OnlineUser[];
  versions: VersionSnapshot[];
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: OnlineUser | null;
  isFullscreen: boolean;
  showVersionHistory: boolean;

  setDocuments: (docs: DocDocument[]) => void;
  addDocument: (doc: DocDocument) => void;
  removeDocument: (docId: string) => void;
  renameDocument: (docId: string, title: string) => void;
  setActiveDocId: (docId: string | null) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addUser: (user: OnlineUser) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: { index: number; length: number }) => void;
  setVersions: (versions: VersionSnapshot[]) => void;
  addVersion: (version: VersionSnapshot) => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setCurrentUser: (user: OnlineUser | null) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setShowVersionHistory: (show: boolean) => void;
}

export const useDocStore = create<DocStore>((set) => ({
  documents: [],
  activeDocId: null,
  onlineUsers: [],
  versions: [],
  isConnected: false,
  isReconnecting: false,
  currentUser: null,
  isFullscreen: false,
  showVersionHistory: false,

  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  removeDocument: (docId) => set((state) => ({
    documents: state.documents.filter((d) => d.id !== docId),
    activeDocId: state.activeDocId === docId ? null : state.activeDocId,
  })),
  renameDocument: (docId, title) => set((state) => ({
    documents: state.documents.map((d) =>
      d.id === docId ? { ...d, title, updatedAt: Date.now() } : d
    ),
  })),
  setActiveDocId: (docId) => set({ activeDocId: docId, showVersionHistory: false }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addUser: (user) => set((state) => ({
    onlineUsers: [...state.onlineUsers.filter((u) => u.userId !== user.userId), user],
  })),
  removeUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId),
  })),
  updateUserCursor: (userId, cursor) => set((state) => ({
    onlineUsers: state.onlineUsers.map((u) =>
      u.userId === userId ? { ...u, cursor } : u
    ),
  })),
  setVersions: (versions) => set({ versions }),
  addVersion: (version) => set((state) => ({
    versions: [...state.versions, version],
  })),
  setConnected: (connected) => set({ isConnected: connected }),
  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setShowVersionHistory: (show) => set({ showVersionHistory: show }),
}));
