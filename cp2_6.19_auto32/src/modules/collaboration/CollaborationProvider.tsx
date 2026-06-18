import React, { useEffect, useRef } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { collaborators, updateCollaborator, tracks, notes, updateTrack, addNote } = useSequencerStore();
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    collaborators.forEach((c) => {
      if (!lastUpdateRef.current.has(c.id)) {
        lastUpdateRef.current.set(c.id, Math.random() * 3000);
      }
    });
  }, [collaborators]);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      collaborators.forEach((collaborator) => {
        const lastUpdate = lastUpdateRef.current.get(collaborator.id) || 0;
        const newUpdate = lastUpdate + delta;
        lastUpdateRef.current.set(collaborator.id, newUpdate);

        if (Math.random() < 0.03) {
          const targetX = 200 + Math.random() * 1200;
          const targetY = 150 + Math.random() * 500;

          updateCollaborator(collaborator.id, {
            cursorX: targetX,
            cursorY: targetY,
          });
        }

        if (newUpdate > 4000 + Math.random() * 4000) {
          lastUpdateRef.current.set(collaborator.id, 0);

          const actions = ['note', 'fader', 'blink'];
          const action = actions[Math.floor(Math.random() * actions.length)];

          if (action === 'note' && tracks.length > 0) {
            updateCollaborator(collaborator.id, {
              activeElement: 'note-edit',
              lastBlinkTime: Date.now(),
            });
          } else if (action === 'fader' && tracks.length > 0) {
            updateCollaborator(collaborator.id, {
              activeElement: 'fader',
              lastBlinkTime: Date.now(),
            });
          } else {
            updateCollaborator(collaborator.id, {
              lastBlinkTime: Date.now(),
            });
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [collaborators, tracks, updateCollaborator, notes, addNote, updateTrack]);

  return <>{children}</>;
};
