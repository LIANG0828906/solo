import { create } from 'zustand';
import type { Marker, User } from '../types';

interface MarkersStore {
  roomId: string | null;
  currentUser: User | null;
  users: User[];
  markers: Marker[];
  playbackTime: number | null;
  playbackMarkers: Marker[];
  selectedMarkerId: string | null;
  pulseMarkerIds: Set<string>;

  setRoom: (roomId: string, user: User, users: User[], markers: Marker[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  addMarker: (marker: Marker, isRemote?: boolean) => void;
  editMarker: (markerId: string, text: string, isRemote?: boolean) => void;
  deleteMarker: (markerId: string, isRemote?: boolean) => void;
  setPlaybackTime: (time: number | null | ((prev: number | null) => number | null)) => void;
  setPlaybackMarkers: (markers: Marker[]) => void;
  setSelectedMarker: (markerId: string | null) => void;
  clearPulse: (markerId: string) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  currentUser: null,
  users: [],
  markers: [],
  playbackTime: null,
  playbackMarkers: [],
  selectedMarkerId: null,
  pulseMarkerIds: new Set<string>(),
};

export const useMarkersStore = create<MarkersStore>((set, get) => ({
  ...initialState,

  setRoom: (roomId, user, users, markers) => {
    set({
      roomId,
      currentUser: user,
      users,
      markers,
      playbackTime: null,
      playbackMarkers: [],
    });
  },

  addUser: (user) => {
    set((state) => ({
      users: [...state.users, user],
    }));
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    }));
  },

  addMarker: (marker, isRemote = false) => {
    set((state) => {
      const newPulse = new Set(state.pulseMarkerIds);
      if (isRemote) {
        newPulse.add(marker.id);
        setTimeout(() => {
          get().clearPulse(marker.id);
        }, 200);
      }
      return {
        markers: [...state.markers, marker],
        pulseMarkerIds: newPulse,
      };
    });
  },

  editMarker: (markerId, text, isRemote = false) => {
    set((state) => {
      const newPulse = new Set(state.pulseMarkerIds);
      if (isRemote) {
        newPulse.add(markerId);
        setTimeout(() => {
          get().clearPulse(markerId);
        }, 200);
      }
      return {
        markers: state.markers.map((m) =>
          m.id === markerId ? { ...m, text, updatedAt: Date.now() } : m
        ),
        pulseMarkerIds: newPulse,
      };
    });
  },

  deleteMarker: (markerId, isRemote = false) => {
    set((state) => {
      const newPulse = new Set(state.pulseMarkerIds);
      if (isRemote) {
        newPulse.add(markerId);
        setTimeout(() => {
          get().clearPulse(markerId);
        }, 200);
      }
      return {
        markers: state.markers.filter((m) => m.id !== markerId),
        pulseMarkerIds: newPulse,
        selectedMarkerId: state.selectedMarkerId === markerId ? null : state.selectedMarkerId,
      };
    });
  },

  setPlaybackTime: (time) => {
    set((state) => ({
      playbackTime: typeof time === 'function' ? time(state.playbackTime) : time,
    }));
  },

  setPlaybackMarkers: (markers) => {
    set({ playbackMarkers: markers });
  },

  setSelectedMarker: (markerId) => {
    set({ selectedMarkerId: markerId });
  },

  clearPulse: (markerId) => {
    set((state) => {
      const newPulse = new Set(state.pulseMarkerIds);
      newPulse.delete(markerId);
      return { pulseMarkerIds: newPulse };
    });
  },

  reset: () => {
    set(initialState);
  },
}));
