import React, { useEffect, useRef } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { Collaborator, CollaboratorCursor as CursorType } from '../../types';

interface CollaboratorCursorProps {
  cursor: CursorType;
  collaborator: Collaborator;
}

export const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({ cursor, collaborator }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentPos = useRef({ x: cursor.x, y: cursor.y });

  useEffect(() => {
    const animate = () => {
      if (!cursorRef.current) return;

      const dx = cursor.targetX - currentPos.current.x;
      const dy = cursor.targetY - currentPos.current.y;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        currentPos.current.x += dx * 0.15;
        currentPos.current.y += dy * 0.15;
      } else {
        currentPos.current.x = cursor.targetX;
        currentPos.current.y = cursor.targetY;
      }

      cursorRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
      if (labelRef.current) {
        labelRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y - 30}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cursor.targetX, cursor.targetY]);

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
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{
            filter: isActive
              ? `drop-shadow(0 0 8px ${collaborator.color})`
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        >
          <path
            d="M2 2 L12 10 L8 12 L10 20 L2 14 L4 10 Z"
            fill={collaborator.color}
            stroke="#fff"
            strokeWidth="1.5"
            style={{
              animation: isActive ? 'pulse 0.5s ease-in-out infinite' : 'none',
            }}
          />
        </svg>
        {isActive && (
          <div
            style={{
              position: 'absolute',
              left: -4,
              top: -4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: collaborator.color,
              opacity: 0.3,
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
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
          transform: `translate(${cursor.x}px, ${cursor.y - 30}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: collaborator.color,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            animation: isActive ? 'bounceIn 0.3s ease' : 'none',
          }}
        >
          <span style={{ fontSize: 12 }}>{collaborator.avatar}</span>
          <span>{collaborator.name}</span>
          {cursor.action === 'dragging-note' && <span style={{ fontSize: 10 }}>🎵</span>}
          {cursor.action === 'dragging-fader' && <span style={{ fontSize: 10 }}>🎚️</span>}
          {cursor.action === 'drawing' && <span style={{ fontSize: 10 }}>✏️</span>}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

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
