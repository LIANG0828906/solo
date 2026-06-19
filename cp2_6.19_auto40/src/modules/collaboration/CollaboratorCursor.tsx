import React, { useEffect, useRef, memo } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { Collaborator, CollaboratorCursor as CursorType } from '../../types';

interface CollaboratorCursorProps {
  cursor: CursorType;
  collaborator: Collaborator;
}

const CollaboratorCursor = memo<CollaboratorCursorProps>(({ cursor, collaborator }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentPos = useRef({ x: cursor.x, y: cursor.y });
  const targetPos = useRef({ x: cursor.targetX, y: cursor.targetY });
  const velocity = useRef({ vx: 0, vy: 0 });

  useEffect(() => {
    targetPos.current.x = cursor.targetX;
    targetPos.current.y = cursor.targetY;
  }, [cursor.targetX, cursor.targetY]);

  useEffect(() => {
    const animate = () => {
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      const friction = 0.85;
      const acceleration = 0.25;

      velocity.current.vx += dx * acceleration;
      velocity.current.vy += dy * acceleration;

      velocity.current.vx *= friction;
      velocity.current.vy *= friction;

      currentPos.current.x += velocity.current.vx;
      currentPos.current.y += velocity.current.vy;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(velocity.current.vx) > 0.05 || Math.abs(velocity.current.vy) > 0.05) {
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
        }
        if (labelRef.current) {
          labelRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y - 32}px)`;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentPos.current.x = targetPos.current.x;
        currentPos.current.y = targetPos.current.y;
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
        }
        if (labelRef.current) {
          labelRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y - 32}px)`;
        }
        animationFrameRef.current = null;
      }
    };

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const isActive = cursor.action !== 'idle';

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 16,
          height: 16,
          pointerEvents: 'none',
          zIndex: 1000,
          transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          willChange: 'transform',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{
            filter: isActive
              ? `drop-shadow(0 0 10px ${collaborator.color})`
              : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
          }}
        >
          <path
            d="M2 2 L12 10 L8 12 L10 20 L2 14 L4 10 Z"
            fill={collaborator.color}
            stroke="#fff"
            strokeWidth="1.5"
            style={{
              animation: isActive ? 'cursorPulse 0.6s ease-in-out infinite' : 'none',
            }}
          />
        </svg>
        {isActive && (
          <div
            style={{
              position: 'absolute',
              left: -2,
              top: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: collaborator.color,
              opacity: 0.4,
              animation: 'cursorPing 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
      </div>

      <div
        ref={labelRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          zIndex: 999,
          transform: `translate(${cursor.x}px, ${cursor.y - 32}px)`,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            backgroundColor: collaborator.color,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 14,
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 10px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            opacity: isActive ? 1 : 0.85,
          }}
        >
          <span style={{ fontSize: 13 }}>{collaborator.avatar}</span>
          <span>{collaborator.name}</span>
          {cursor.action === 'dragging-note' && <span style={{ fontSize: 11 }}>🎵</span>}
          {cursor.action === 'dragging-fader' && <span style={{ fontSize: 11 }}>🎚️</span>}
          {cursor.action === 'drawing' && <span style={{ fontSize: 11 }}>✏️</span>}
        </div>
      </div>

      <style>{`
        @keyframes cursorPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes cursorPing {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
});

CollaboratorCursor.displayName = 'CollaboratorCursor';

interface CollaboratorsOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const CollaboratorsOverlay: React.FC<CollaboratorsOverlayProps> = () => {
  const { collaborators, collaboratorCursors } = useSequencerStore();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {collaboratorCursors.map((cursor) => {
        const collaborator = collaborators.find((c) => c.id === cursor.collaboratorId);
        if (!collaborator || !collaborator.isOnline) return null;
        return <CollaboratorCursor key={cursor.collaboratorId} cursor={cursor} collaborator={collaborator} />;
      })}
    </div>
  );
};
