import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Song, Chord, LyricBlock, User, Cursor, HistoryEntry } from '../types';
import { songAPI } from '../services/api';
import websocketService from '../services/websocket';

interface SongState {
  currentSong: Song | null;
  songs: any[];
  chordSequence: Chord[][];
  lyricBlocks: LyricBlock[];
  key: string;
  timeSignature: '4/4' | '3/4';
  bpm: number;
  collaborators: User[];
  remoteCursors: Cursor[];
  isPlaying: boolean;
  currentMeasure: number;
  history: HistoryEntry[];
  historyIndex: number;
  recommendations: Record<number, string>;
  userId: string;
  userName: string;
  loading: boolean;
  error: string | null;

  setUserId: (id: string) => void;
  setUserName: (name: string) => void;
  loadSongs: () => Promise<void>;
  loadSong: (id: string) => Promise<void>;
  createSong: (name: string, timeSignature: '4/4' | '3/4') => Promise<Song | null>;
  updateSong: (songId: string, updates: { name?: string; bpm?: number; key?: string }) => Promise<void>;
  setSong: (song: Song) => void;
  addChord: (measure: number, position: number, chord: string) => Promise<void>;
  removeChord: (measure: number, position: number) => Promise<void>;
  updateLyric: (blockId: string, content: string, formatting?: { bold: boolean; italic: boolean }) => Promise<void>;
  requestRecommendation: (measure: number) => Promise<string>;
  startPlayback: () => void;
  stopPlayback: () => void;
  setCurrentMeasure: (measure: number) => void;
  addCollaborator: (user: User) => void;
  removeCollaborator: (userId: string) => void;
  updateCursor: (cursor: Cursor) => void;
  undo: () => void;
  redo: () => void;
  connectWebSocket: (songId: string) => Promise<void>;
  disconnectWebSocket: () => void;
  sendCursorPosition: (measure: number, position: number, type: 'lyric' | 'chord') => void;
  clearError: () => void;
}

export const useSongStore = create<SongState>((set, get) => ({
  currentSong: null,
  songs: [],
  chordSequence: [],
  lyricBlocks: [],
  key: 'C',
  timeSignature: '4/4',
  bpm: 120,
  collaborators: [],
  remoteCursors: [],
  isPlaying: false,
  currentMeasure: -1,
  history: [],
  historyIndex: -1,
  recommendations: {},
  userId: '',
  userName: '',
  loading: false,
  error: null,

  setUserId: (id: string) => set({ userId: id }),
  setUserName: (name: string) => set({ userName: name }),

  loadSongs: async () => {
    try {
      set({ loading: true, error: null });
      const songs = await songAPI.getSongs();
      set({ songs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadSong: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const song = await songAPI.getSong(id);
      get().setSong(song);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createSong: async (name: string, timeSignature: '4/4' | '3/4') => {
    try {
      set({ loading: true, error: null });
      const song = await songAPI.createSong(name, timeSignature);
      set({ loading: false });
      return song;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateSong: async (songId: string, updates: { name?: string; bpm?: number; key?: string }) => {
    try {
      set({ error: null });
      const updatedSong = await songAPI.updateSong(songId, updates);
      
      set(state => {
        if (state.currentSong?.id === songId) {
          return {
            currentSong: updatedSong,
            bpm: updates.bpm !== undefined ? updates.bpm : state.bpm,
            key: updates.key !== undefined ? updates.key : state.key
          };
        }
        return {};
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setSong: (song: Song) => {
    set({
      currentSong: song,
      chordSequence: song.chordSequence,
      lyricBlocks: song.lyricBlocks,
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      history: [],
      historyIndex: -1
    });
  },

  addChord: async (measure: number, position: number, chord: string) => {
    const { currentSong, userId } = get();
    if (!currentSong) return;

    const op = { measure, position, chord, timestamp: Date.now() };
    
    set(state => {
      const newSequence = [...state.chordSequence];
      if (!newSequence[measure]) {
        newSequence[measure] = [];
      }
      const newChord: Chord = {
        id: uuidv4(),
        name: chord,
        duration: 2
      };
      newSequence[measure] = [
        ...newSequence[measure].slice(0, position),
        newChord,
        ...newSequence[measure].slice(position)
      ];
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        type: 'chord_add',
        payload: { measure, position, chord },
        timestamp: Date.now()
      });
      
      return {
        chordSequence: newSequence,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });

    try {
      await songAPI.addChord(currentSong.id, op);
      websocketService.sendChordAdd(currentSong.id, userId, op);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeChord: async (measure: number, position: number) => {
    const { currentSong, userId } = get();
    if (!currentSong) return;

    const op = { measure, position, timestamp: Date.now() };

    set(state => {
      const newSequence = [...state.chordSequence];
      if (!newSequence[measure]) return state;
      
      const removedChord = newSequence[measure][position];
      newSequence[measure] = newSequence[measure].filter((_, i) => i !== position);
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        type: 'chord_remove',
        payload: { measure, position, chord: removedChord?.name },
        timestamp: Date.now()
      });
      
      return {
        chordSequence: newSequence,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });

    try {
      await songAPI.removeChord(currentSong.id, op);
      websocketService.sendChordRemove(currentSong.id, userId, op);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateLyric: async (blockId: string, content: string, formatting?: { bold: boolean; italic: boolean }) => {
    const { currentSong, userId } = get();
    if (!currentSong) return;

    const op = { blockId, content, formatting, timestamp: Date.now() };

    set(state => {
      const newBlocks = state.lyricBlocks.map(block =>
        block.id === blockId
          ? { ...block, content, formatting: formatting || block.formatting }
          : block
      );
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        type: 'lyric_update',
        payload: { blockId, content, formatting },
        timestamp: Date.now()
      });
      
      return {
        lyricBlocks: newBlocks,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });

    try {
      await songAPI.updateLyric(currentSong.id, op);
      websocketService.sendLyricUpdate(currentSong.id, userId, op);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  requestRecommendation: async (measure: number): Promise<string> => {
    const { currentSong, recommendations } = get();
    if (!currentSong) return 'C';

    if (recommendations[measure]) {
      return recommendations[measure];
    }

    try {
      const result = await songAPI.getRecommendation(currentSong.id, measure);
      set(state => ({
        recommendations: {
          ...state.recommendations,
          [measure]: result.recommended
        }
      }));
      return result.recommended;
    } catch (error: any) {
      set({ error: error.message });
      return 'C';
    }
  },

  startPlayback: () => set({ isPlaying: true, currentMeasure: 0 }),
  stopPlayback: () => set({ isPlaying: false, currentMeasure: -1 }),
  setCurrentMeasure: (measure: number) => set({ currentMeasure: measure }),

  addCollaborator: (user: User) => {
    set(state => ({
      collaborators: [...state.collaborators.filter(u => u.id !== user.id), user]
    }));
  },

  removeCollaborator: (userId: string) => {
    set(state => ({
      collaborators: state.collaborators.filter(u => u.id !== userId),
      remoteCursors: state.remoteCursors.filter(c => c.userId !== userId)
    }));
  },

  updateCursor: (cursor: Cursor) => {
    set(state => {
      const existingIndex = state.remoteCursors.findIndex(c => c.userId === cursor.userId);
      if (existingIndex >= 0) {
        const newCursors = [...state.remoteCursors];
        newCursors[existingIndex] = cursor;
        return { remoteCursors: newCursors };
      }
      return { remoteCursors: [...state.remoteCursors, cursor] };
    });
  },

  undo: () => {
    const { history, historyIndex, chordSequence, lyricBlocks } = get();
    if (historyIndex < 0) return;

    const entry = history[historyIndex];
    set(state => {
      let newSequence = [...state.chordSequence];
      let newBlocks = [...state.lyricBlocks];

      if (entry.type === 'chord_add') {
        const { measure, position } = entry.payload;
        if (newSequence[measure]) {
          newSequence[measure] = newSequence[measure].filter((_, i) => i !== position);
        }
      } else if (entry.type === 'chord_remove') {
        const { measure, position, chord } = entry.payload;
        if (!newSequence[measure]) newSequence[measure] = [];
        const newChord: Chord = {
          id: uuidv4(),
          name: chord,
          duration: 2
        };
        newSequence[measure].splice(position, 0, newChord);
      } else if (entry.type === 'lyric_update') {
        const { blockId } = entry.payload;
        const originalBlock = lyricBlocks.find(b => b.id === blockId);
        if (originalBlock) {
          newBlocks = newBlocks.map(b =>
            b.id === blockId ? { ...originalBlock } : b
          );
        }
      }

      return {
        chordSequence: newSequence,
        lyricBlocks: newBlocks,
        historyIndex: historyIndex - 1
      };
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const entry = history[historyIndex + 1];
    set(state => {
      let newSequence = [...state.chordSequence];
      let newBlocks = [...state.lyricBlocks];

      if (entry.type === 'chord_add') {
        const { measure, position, chord } = entry.payload;
        if (!newSequence[measure]) newSequence[measure] = [];
        const newChord: Chord = {
          id: uuidv4(),
          name: chord,
          duration: 2
        };
        newSequence[measure].splice(position, 0, newChord);
      } else if (entry.type === 'chord_remove') {
        const { measure, position } = entry.payload;
        if (newSequence[measure]) {
          newSequence[measure] = newSequence[measure].filter((_, i) => i !== position);
        }
      } else if (entry.type === 'lyric_update') {
        const { blockId, content, formatting } = entry.payload;
        newBlocks = newBlocks.map(b =>
          b.id === blockId
            ? { ...b, content, formatting: formatting || b.formatting }
            : b
        );
      }

      return {
        chordSequence: newSequence,
        lyricBlocks: newBlocks,
        historyIndex: historyIndex + 1
      };
    });
  },

  connectWebSocket: async (songId: string) => {
    const { userId, userName } = get();
    try {
      const wsUrl = window.location.protocol === 'https:'
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.host}/ws`;
      
      await websocketService.connect(wsUrl);
      websocketService.join(songId, userId, userName);

      websocketService.subscribe((message) => {
        if (message.type === 'user_joined') {
          get().addCollaborator(message.user);
        } else if (message.type === 'user_left') {
          get().removeCollaborator(message.userId);
        } else if (message.type === 'chord_added') {
          if (message.payload.userId !== get().userId) {
            set(state => {
              const newSequence = [...state.chordSequence];
              if (!newSequence[message.payload.measure]) {
                newSequence[message.payload.measure] = [];
              }
              const newChord: Chord = {
                id: uuidv4(),
                name: message.payload.chord!,
                duration: 2
              };
              newSequence[message.payload.measure].splice(
                message.payload.position,
                0,
                newChord
              );
              return { chordSequence: newSequence };
            });
          }
        } else if (message.type === 'chord_removed') {
          if (message.payload.userId !== get().userId) {
            set(state => {
              const newSequence = [...state.chordSequence];
              if (newSequence[message.payload.measure]) {
                newSequence[message.payload.measure] = newSequence[
                  message.payload.measure
                ].filter((_, i) => i !== message.payload.position);
              }
              return { chordSequence: newSequence };
            });
          }
        } else if (message.type === 'lyric_updated') {
          if (message.payload.userId !== get().userId) {
            set(state => ({
              lyricBlocks: state.lyricBlocks.map(b =>
                b.id === message.payload.blockId
                  ? {
                      ...b,
                      content: message.payload.content,
                      formatting: message.payload.formatting || b.formatting
                    }
                  : b
              )
            }));
          }
        } else if (message.type === 'cursor_moved') {
          if (message.payload.userId !== get().userId) {
            get().updateCursor({
              userId: message.payload.userId,
              userName: message.payload.userName,
              color: message.payload.color,
              measure: message.payload.measure,
              position: message.payload.position,
              type: message.payload.type
            });
          }
        } else if (message.type === 'error') {
          set({ error: message.message });
        }
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  disconnectWebSocket: () => {
    const { currentSong, userId } = get();
    if (currentSong) {
      websocketService.leave(currentSong.id, userId);
    }
    websocketService.disconnect();
  },

  sendCursorPosition: (measure: number, position: number, type: 'lyric' | 'chord') => {
    const { currentSong, userId, userName } = get();
    if (currentSong && websocketService.isConnected()) {
      websocketService.sendCursorMove(
        currentSong.id,
        userId,
        userName,
        measure,
        position,
        type
      );
    }
  },

  clearError: () => set({ error: null })
}));
