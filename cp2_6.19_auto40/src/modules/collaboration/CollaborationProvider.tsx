import React, { useEffect, useRef, useCallback } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { TOTAL_BEATS, PITCH_MIN, PITCH_MAX } from '../../types';

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
    cursorPosition,
    isPlaying,
  } = useSequencerStore();

  const broadcastIntervalRef = useRef<number | null>(null);
  const simulationTimeoutsRef = useRef<Map<string, number>>(new Map());
  const actionStateRef = useRef<Map<string, { action: string; data: any }>>(new Map());

  const broadcastCursorPosition = useCallback(
    (collaboratorId: string, x: number, y: number, action: any = 'idle') => {
      updateCollaboratorCursor({
        collaboratorId,
        x: 0,
        y: 0,
        targetX: x,
        targetY: y,
        action,
      });
    },
    [updateCollaboratorCursor]
  );

  const simulateUserAction = useCallback(
    (collaboratorId: string) => {
      const collaborator = collaborators.find((c) => c.id === collaboratorId);
      if (!collaborator || !collaborator.isOnline) return;


      const currentState = actionStateRef.current.get(collaboratorId);

      if (currentState && currentState.action !== 'idle') {
        const elapsed = Date.now() - currentState.data.startTime;
        if (elapsed < currentState.data.animDuration) {
          if (currentState.action === 'drag-note') {
            const progress = elapsed / currentState.data.duration;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const newStart = currentState.data.startStart + (currentState.data.endStart - currentState.data.startStart) * easeProgress;
            const newPitch = currentState.data.startPitch + (currentState.data.endPitch - currentState.data.startPitch) * easeProgress;

            moveNote(currentState.data.noteId, newStart, Math.round(newPitch), currentState.data.noteDuration);

            const x = 260 + newStart * 16;
            const trackIndex = tracks.findIndex((t) => t.id === currentState.data.trackId);
            let trackOffset = 28;
            for (let i = 0; i < trackIndex; i++) {
              trackOffset += tracks[i].height + 28;
            }
            const pitchHeight = tracks[trackIndex].height / (PITCH_MAX - PITCH_MIN);
            const y = trackOffset + (PITCH_MAX - Math.round(newPitch)) * pitchHeight;

            broadcastCursorPosition(collaboratorId, x, y, 'dragging-note');
          } else if (currentState.action === 'adjust-fader') {
            const progress = elapsed / currentState.data.animDuration;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const newVolume =
              currentState.data.startVolume + (currentState.data.endVolume - currentState.data.startVolume) * easeProgress;

            setTrackVolume(currentState.data.trackId, Math.round(newVolume * 100) / 100);

            const trackIndex = tracks.findIndex((t) => t.id === currentState.data.trackId);
            const x = 100;
            const y = 120 + trackIndex * 200 + 80;

            broadcastCursorPosition(collaboratorId, x, y, 'dragging-fader');
          } else if (currentState.action === 'draw-note') {
            const progress = elapsed / currentState.data.animDuration;
            const x = 260 + currentState.data.startBeat * 16 + progress * currentState.data.noteDuration * 64;
            const trackIndex = tracks.findIndex((t) => t.id === currentState.data.trackId);
            let trackOffset = 28;
            for (let i = 0; i < trackIndex; i++) {
              trackOffset += tracks[i].height + 28;
            }
            const pitchHeight = tracks[trackIndex].height / (PITCH_MAX - PITCH_MIN);
            const y = trackOffset + (PITCH_MAX - currentState.data.pitch) * pitchHeight;

            broadcastCursorPosition(collaboratorId, x, y, 'drawing');

            if (progress >= 1) {
              addNote({
                trackId: currentState.data.trackId,
                pitch: currentState.data.pitch,
                start: currentState.data.startBeat,
                duration: Math.max(0.25, currentState.data.noteDuration),
                velocity: 0.7 + Math.random() * 0.3,
              });
            }
          }
          return;
        } else {
          actionStateRef.current.delete(collaboratorId);
          broadcastCursorPosition(collaboratorId, Math.random() * 800 + 200, Math.random() * 400 + 100, 'idle');
        }
      }

      const weightedActions = ['idle', 'idle', 'move-cursor', 'move-cursor', 'draw-note', 'drag-note', 'adjust-fader'];
      const randomAction = weightedActions[Math.floor(Math.random() * weightedActions.length)];

      if (randomAction === 'idle') {
        broadcastCursorPosition(collaboratorId, Math.random() * 800 + 200, Math.random() * 400 + 100, 'idle');
        const timeout = window.setTimeout(() => simulateUserAction(collaboratorId), 1000 + Math.random() * 2000);
        simulationTimeoutsRef.current.set(collaboratorId, timeout);
      } else if (randomAction === 'move-cursor') {
        const targetX = Math.random() * 800 + 200;
        const targetY = Math.random() * 400 + 100;
        broadcastCursorPosition(collaboratorId, targetX, targetY, 'idle');
        const timeout = window.setTimeout(() => simulateUserAction(collaboratorId), 800 + Math.random() * 1500);
        simulationTimeoutsRef.current.set(collaboratorId, timeout);
      } else if (randomAction === 'draw-note' && tracks.length > 0) {
        const trackIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[trackIndex];
        const trackNotes = notes.filter((n) => n.trackId === track.id);
        if (trackNotes.length < 128) {
          const pitch = PITCH_MIN + Math.floor(Math.random() * (PITCH_MAX - PITCH_MIN));
          const startBeat = Math.floor(Math.random() * (TOTAL_BEATS - 4));

          actionStateRef.current.set(collaboratorId, {
            action: 'draw-note',
            data: {
              startTime: Date.now(),
              animDuration: 1500 + Math.random() * 1000,
              trackId: track.id,
              pitch,
              startBeat,
              noteDuration: 1 + Math.floor(Math.random() * 3),
            },
          });

          const timeout = window.setTimeout(() => simulateUserAction(collaboratorId), 100);
          simulationTimeoutsRef.current.set(collaboratorId, timeout);
        } else {
          simulateUserAction(collaboratorId);
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
            actionStateRef.current.set(collaboratorId, {
              action: 'drag-note',
              data: {
                startTime: Date.now(),
                animDuration: 1500 + Math.random() * 1500,
                noteId: randomNote.id,
                trackId: randomNote.trackId,
                startStart: randomNote.start,
                startPitch: randomNote.pitch,
                endStart: Math.max(0, Math.min(TOTAL_BEATS - 4, randomNote.start + (Math.random() - 0.5) * 8)),
                endPitch: Math.max(PITCH_MIN, Math.min(PITCH_MAX, randomNote.pitch + Math.floor((Math.random() - 0.5) * 12))),
                noteDuration: randomNote.duration,
              },
            });

            const timeout = window.setTimeout(() => simulateUserAction(collaboratorId), 100);
            simulationTimeoutsRef.current.set(collaboratorId, timeout);
          }
        } else {
          simulateUserAction(collaboratorId);
        }
      } else if (randomAction === 'adjust-fader' && tracks.length > 0) {
        const trackIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[trackIndex];

        actionStateRef.current.set(collaboratorId, {
          action: 'adjust-fader',
          data: {
            startTime: Date.now(),
            duration: 1000 + Math.random() * 1000,
            trackId: track.id,
            startVolume: track.volume,
            endVolume: 0.5 + Math.random() * 0.5,
          },
        });

        const timeout = window.setTimeout(() => simulateUserAction(collaboratorId), 100);
        simulationTimeoutsRef.current.set(collaboratorId, timeout);
      }
    },
    [collaborators, tracks, notes, broadcastCursorPosition, moveNote, setTrackVolume, addNote]
  );

  useEffect(() => {
    const virtualUsers = collaborators.filter((c) => c.id !== 'user-1');

    virtualUsers.forEach((user) => {
      const timeout = window.setTimeout(() => {
        simulateUserAction(user.id);
      }, Math.random() * 2000);
      simulationTimeoutsRef.current.set(user.id, timeout);
    });

    return () => {
      simulationTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      simulationTimeoutsRef.current.clear();
      actionStateRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      collaborators.filter((c) => c.id !== 'user-1').forEach((user) => {
        if (!simulationTimeoutsRef.current.has(user.id)) {
          simulateUserAction(user.id);
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [simulateUserAction, collaborators]);

  useEffect(() => {
    const broadcastState = () => {
      const state = {
        cursorPosition,
        isPlaying,
        tracks: tracks.map((t) => ({ id: t.id, volume: t.volume, muted: t.muted, solo: t.solo })),
        notesCount: notes.length,
        timestamp: Date.now(),
      };
      console.log('[Collaboration] Broadcasting state:', state);
    };

    broadcastIntervalRef.current = window.setInterval(broadcastState, 5000);

    return () => {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
      }
    };
  }, [cursorPosition, isPlaying, tracks, notes.length]);

  return <>{children}</>;
};
