import React, { useEffect, useRef, useCallback } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { sequencerEngine } from '../sequencer/SequencerEngine';
import { TOTAL_BEATS, PITCH_MIN, PITCH_MAX } from '../../types';

interface SimulatedWebSocketMessage {
  type: 'cursor_update' | 'note_add' | 'note_move' | 'volume_change' | 'state_sync';
  payload: any;
  userId: string;
  timestamp: number;
}

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const {
    tracks,
    notes,
    collaborators,
    updateCollaboratorCursor,
    setTrackVolume,
    addNote,
    moveNote,
  } = useSequencerStore();

  const lastSyncTimeRef = useRef<number>(Date.now());
  const messageQueueRef = useRef<SimulatedWebSocketMessage[]>([]);
  const actionTimersRef = useRef<Map<string, number>>(new Map());
  const actionStateRef = useRef<Map<string, { action: string; data: any; startTime: number; duration: number }>>(
    new Map()
  );
  const cursorAnimFramesRef = useRef<Map<string, number>>(new Map());

  const broadcastMessage = useCallback((message: Omit<SimulatedWebSocketMessage, 'timestamp'>) => {
    const msg: SimulatedWebSocketMessage = {
      ...message,
      timestamp: Date.now(),
    };
    messageQueueRef.current.push(msg);

    const latency = 30 + Math.random() * 50;
    setTimeout(() => {
      const index = messageQueueRef.current.findIndex((m) => m.timestamp === msg.timestamp);
      if (index !== -1) {
        messageQueueRef.current.splice(index, 1);
        if (msg.userId !== 'user-1') {
          handleIncomingMessage(msg);
        }
      }
    }, latency);
  }, []);

  const handleIncomingMessage = useCallback(
    (message: SimulatedWebSocketMessage) => {
      const now = Date.now();
      const timeDiff = now - message.timestamp;

      if (timeDiff > 200) {
        console.log(`[Collaboration] Dropping stale message from ${message.userId}: ${timeDiff}ms old`);
        return;
      }

      switch (message.type) {
        case 'cursor_update':
          updateCollaboratorCursor({
            collaboratorId: message.userId,
            x: 0,
            y: 0,
            targetX: message.payload.x,
            targetY: message.payload.y,
            action: message.payload.action,
            targetNoteId: message.payload.targetNoteId,
            targetTrackId: message.payload.targetTrackId,
          });
          break;

        case 'note_add':
          addNote(message.payload.note);
          break;

        case 'note_move':
          moveNote(message.payload.noteId, message.payload.start, message.payload.pitch, message.payload.duration);
          break;

        case 'volume_change':
          setTrackVolume(message.payload.trackId, message.payload.volume);
          break;

        default:
          break;
      }
    },
    [updateCollaboratorCursor, addNote, moveNote, setTrackVolume]
  );

  const simulateUserAction = useCallback(
    (userId: string) => {
      const collaborator = collaborators.find((c) => c.id === userId);
      if (!collaborator || !collaborator.isOnline) return;

      const currentAction = actionStateRef.current.get(userId);

      if (currentAction) {
        const elapsed = Date.now() - currentAction.startTime;
        const progress = Math.min(1, elapsed / currentAction.duration);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        if (progress < 1) {
          switch (currentAction.action) {
            case 'draw-note': {
              const { trackId, startBeat, noteDuration, pitch } = currentAction.data;
              const currentX = 260 + (startBeat + easeProgress * noteDuration) * 16;

              let trackOffset = 28;
              const trackIndex = tracks.findIndex((t) => t.id === trackId);
              for (let i = 0; i < trackIndex; i++) {
                trackOffset += tracks[i].height + 28;
              }
              const pitchHeight = tracks[trackIndex]?.height
                ? tracks[trackIndex].height / (PITCH_MAX - PITCH_MIN)
                : 2;
              const currentY = trackOffset + (PITCH_MAX - pitch) * pitchHeight;

              broadcastMessage({
                type: 'cursor_update',
                userId,
                payload: {
                  x: currentX,
                  y: currentY,
                  action: 'drawing',
                  targetTrackId: trackId,
                },
              });
              break;
            }

            case 'drag-note': {
              const { noteId, trackId, startStart, startPitch, endStart, endPitch } = currentAction.data;
              const currentStart = startStart + (endStart - startStart) * easeProgress;
              const currentPitch = startPitch + (endPitch - startPitch) * easeProgress;

              moveNote(noteId, currentStart, Math.round(currentPitch), currentAction.data.noteDuration);

              const currentX = 260 + currentStart * 16;
              let trackOffset = 28;
              const trackIndex = tracks.findIndex((t) => t.id === trackId);
              for (let i = 0; i < trackIndex; i++) {
                trackOffset += tracks[i].height + 28;
              }
              const pitchHeight = tracks[trackIndex]?.height
                ? tracks[trackIndex].height / (PITCH_MAX - PITCH_MIN)
                : 2;
              const currentY = trackOffset + (PITCH_MAX - Math.round(currentPitch)) * pitchHeight;

              broadcastMessage({
                type: 'cursor_update',
                userId,
                payload: {
                  x: currentX,
                  y: currentY,
                  action: 'dragging-note',
                  targetNoteId: noteId,
                  targetTrackId: trackId,
                },
              });
              break;
            }

            case 'adjust-fader': {
              const { trackId, startVolume, endVolume } = currentAction.data;
              const currentVolume = startVolume + (endVolume - startVolume) * easeProgress;

              sequencerEngine.setTrackVolume(trackId, Math.round(currentVolume * 100) / 100);

              const x = 100;
              const trackIndex = tracks.findIndex((t) => t.id === trackId);
              const y = 120 + trackIndex * 200 + 80;

              broadcastMessage({
                type: 'cursor_update',
                userId,
                payload: {
                  x,
                  y,
                  action: 'dragging-fader',
                  targetTrackId: trackId,
                },
              });
              break;
            }
          }

          const nextFrame = window.setTimeout(() => simulateUserAction(userId), 16);
          actionTimersRef.current.set(userId, nextFrame);
          return;
        } else {
          if (currentAction.action === 'draw-note') {
            const { trackId, startBeat, noteDuration, pitch } = currentAction.data;
            addNote({
              trackId,
              pitch,
              start: startBeat,
              duration: noteDuration,
              velocity: 0.7 + Math.random() * 0.3,
            });
          }

          actionStateRef.current.delete(userId);

          broadcastMessage({
            type: 'cursor_update',
            userId,
            payload: {
              x: Math.random() * 800 + 200,
              y: Math.random() * 400 + 100,
              action: 'idle',
            },
          });
        }
      }

      const actions = ['idle', 'idle', 'move-cursor', 'move-cursor', 'draw-note', 'drag-note', 'adjust-fader'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      if (randomAction === 'idle') {
        broadcastMessage({
          type: 'cursor_update',
          userId,
          payload: {
            x: Math.random() * 800 + 200,
            y: Math.random() * 400 + 100,
            action: 'idle',
          },
        });

        const timeout = window.setTimeout(() => simulateUserAction(userId), 1500 + Math.random() * 2500);
        actionTimersRef.current.set(userId, timeout);
      } else if (randomAction === 'move-cursor') {
        const targetX = Math.random() * 800 + 200;
        const targetY = Math.random() * 400 + 100;

        broadcastMessage({
          type: 'cursor_update',
          userId,
          payload: {
            x: targetX,
            y: targetY,
            action: 'idle',
          },
        });

        const timeout = window.setTimeout(() => simulateUserAction(userId), 600 + Math.random() * 1200);
        actionTimersRef.current.set(userId, timeout);
      } else if (randomAction === 'draw-note' && tracks.length > 0) {
        const trackIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[trackIndex];
        const trackNotes = notes.filter((n) => n.trackId === track.id);

        if (trackNotes.length < 128) {
          const pitch = PITCH_MIN + Math.floor(Math.random() * (PITCH_MAX - PITCH_MIN));
          const startBeat = Math.floor(Math.random() * (TOTAL_BEATS - 4));

          actionStateRef.current.set(userId, {
            action: 'draw-note',
            startTime: Date.now(),
            duration: 800 + Math.random() * 700,
            data: {
              trackId: track.id,
              pitch,
              startBeat,
              noteDuration: 1 + Math.floor(Math.random() * 3),
            },
          });

          simulateUserAction(userId);
          return;
        } else {
          simulateUserAction(userId);
          return;
        }
      } else if (randomAction === 'drag-note' && notes.length > 0) {
        const trackNotes = notes.filter((n) => {
          const track = tracks.find((t) => t.id === n.trackId);
          return track && !track.muted;
        });

        if (trackNotes.length > 0) {
          const randomNote = trackNotes[Math.floor(Math.random() * trackNotes.length)];
          const track = tracks.find((t) => t.id === randomNote.trackId);

          if (track) {
            actionStateRef.current.set(userId, {
              action: 'drag-note',
              startTime: Date.now(),
              duration: 1000 + Math.random() * 1000,
              data: {
                noteId: randomNote.id,
                trackId: randomNote.trackId,
                startStart: randomNote.start,
                startPitch: randomNote.pitch,
                endStart: Math.max(0, Math.min(TOTAL_BEATS - 4, randomNote.start + (Math.random() - 0.5) * 8)),
                endPitch: Math.max(
                  PITCH_MIN,
                  Math.min(PITCH_MAX, randomNote.pitch + Math.floor((Math.random() - 0.5) * 10))
                ),
                noteDuration: randomNote.duration,
              },
            });

            simulateUserAction(userId);
            return;
          }
        }
        simulateUserAction(userId);
        return;
      } else if (randomAction === 'adjust-fader' && tracks.length > 0) {
        const trackIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[trackIndex];

        actionStateRef.current.set(userId, {
          action: 'adjust-fader',
          startTime: Date.now(),
          duration: 700 + Math.random() * 800,
          data: {
            trackId: track.id,
            startVolume: track.volume,
            endVolume: 0.4 + Math.random() * 0.7,
          },
        });

        simulateUserAction(userId);
        return;
      }
    },
    [collaborators, tracks, notes, broadcastMessage, addNote, moveNote]
  );

  useEffect(() => {
    const virtualUsers = collaborators.filter((c) => c.id !== 'user-1');

    virtualUsers.forEach((user, index) => {
      const delay = index * 800 + Math.random() * 1500;
      const timeout = window.setTimeout(() => {
        simulateUserAction(user.id);
      }, delay);
      actionTimersRef.current.set(user.id, timeout);
    });

    return () => {
      actionTimersRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      actionTimersRef.current.clear();
      actionStateRef.current.clear();
      cursorAnimFramesRef.current.forEach((frame) => {
        cancelAnimationFrame(frame);
      });
      cursorAnimFramesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      lastSyncTimeRef.current = Date.now();
      console.log('[Collaboration] State sync completed');
    }, 5000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const checkInterval = window.setInterval(() => {
      collaborators.filter((c) => c.id !== 'user-1').forEach((user) => {
        if (!actionTimersRef.current.has(user.id) && !actionStateRef.current.has(user.id)) {
          simulateUserAction(user.id);
        }
      });
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [simulateUserAction, collaborators]);

  useEffect(() => {
    const connectTimeout = setTimeout(() => {
      console.log('[Collaboration] WebSocket connection established');
    }, 500);

    return () => clearTimeout(connectTimeout);
  }, []);

  return <>{children}</>;
};
