import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Fragment, Artifact } from '../types';

const BOARD_SIZE = 400;
const SYNTHESIS_CENTER = { x: BOARD_SIZE / 2, y: BOARD_SIZE / 2 };
const SYNTHESIS_RADIUS = 80;

const shapeToPath = (shape: number[][], size: number): string => {
  if (shape.length === 0) return '';
  const points = shape.map(([x, y]) => `${(x + 0.5) * size},${(y + 0.5) * size}`).join(' ');
  return `polygon(${points})`;
};

interface DraggedFragment {
  fragment: Fragment;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
}

const ReconstructionBoard: React.FC = () => {
  const {
    pickedFragments,
    rotateFragment,
    placeFragment,
    currentArtifact,
    viewingArtifact,
    artifacts,
  } = useStore();

  const [dragged, setDragged] = useState<DraggedFragment | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setRotationAngle((prev) => (prev + 0.5) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const displayArtifact = viewingArtifact || (currentArtifact?.fragments.every((f) => 
    pickedFragments.find((pf) => pf.id === f.id)?.isPlaced
  ) ? currentArtifact : null);

  const isComplete = displayArtifact && displayArtifact.fragments.every((f) => 
    pickedFragments.find((pf) => pf.id === f.id)?.isPlaced
  );

  const handleFragmentMouseDown = (
    e: React.MouseEvent,
    fragment: Fragment,
    fragmentX: number,
    fragmentY: number
  ) => {
    if (fragment.isPlaced) return;
    e.preventDefault();
    setDragged({
      fragment,
      offsetX: e.clientX - fragmentX,
      offsetY: e.clientY - fragmentY,
      currentX: fragmentX,
      currentY: fragmentY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragged) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const newX = e.clientX - dragged.offsetX;
    const newY = e.clientY - dragged.offsetY;
    setDragged({ ...dragged, currentX: newX, currentY: newY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragged) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const relX = ((e.clientX - dragged.offsetX - boardRect.left) / BOARD_SIZE) * 100;
    const relY = ((e.clientY - dragged.offsetY - boardRect.top) / BOARD_SIZE) * 100;

    placeFragment(dragged.fragment.id, relX, relY);
    setDragged(null);
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    fragment: Fragment,
    fragmentX: number,
    fragmentY: number
  ) => {
    if (fragment.isPlaced) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragged({
      fragment,
      offsetX: touch.clientX - fragmentX,
      offsetY: touch.clientY - fragmentY,
      currentX: fragmentX,
      currentY: fragmentY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragged) return;
    const touch = e.touches[0];
    setDragged({
      ...dragged,
      currentX: touch.clientX - dragged.offsetX,
      currentY: touch.clientY - dragged.offsetY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragged) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const touch = e.changedTouches[0];
    const relX = ((touch.clientX - dragged.offsetX - boardRect.left) / BOARD_SIZE) * 100;
    const relY = ((touch.clientY - dragged.offsetY - boardRect.top) / BOARD_SIZE) * 100;

    placeFragment(dragged.fragment.id, relX, relY);
    setDragged(null);
  };

  const renderPlacedFragments = (artifact: Artifact) => {
    return artifact.fragments.map((f) => {
      const pf = pickedFragments.find((p) => p.id === f.id);
      if (!pf || !pf.isPlaced) return null;

      const x = (pf.currentX / 100) * BOARD_SIZE - pf.size / 2;
      const y = (pf.currentY / 100) * BOARD_SIZE - pf.size / 2;

      return (
        <div
          key={pf.id}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: pf.size,
            height: pf.size,
            backgroundColor: pf.color,
            clipPath: shapeToPath(pf.shape, pf.size),
            transform: `rotate(${pf.rotation}deg)`,
            transition: 'all 0.5s ease-out',
            animation: 'glowPulse 0.5s ease-out 3',
          }}
        />
      );
    });
  };

  const renderCompleteArtifact = (artifact: Artifact) => {
    const scale = viewingArtifact ? 1 : 0;
    
    return (
      <div
        style={{
          position: 'absolute',
          left: BOARD_SIZE / 2 - 60,
          top: BOARD_SIZE / 2 - 60,
          width: 120,
          height: 120,
          transform: `scale(${viewingArtifact ? 1 : 1}) rotateY(${viewingArtifact ? rotationAngle : 0}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease-out',
          animation: viewingArtifact ? 'none' : `artifactRise 0.5s ease-out`,
          perspective: '1000px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: artifact.color,
            borderRadius: '50% 50% 45% 45%',
            boxShadow: 'inset -10px -10px 30px rgba(0,0,0,0.3), inset 10px 10px 30px rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            textAlign: 'center',
            fontFamily: 'cursive, "Brush Script MT", "Ma Shan Zheng", serif',
            color: '#E8D5B7',
            fontSize: '16px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{artifact.name}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{artifact.year}</div>
        </div>
      </div>
    );
  };

  const unplacedFragments = pickedFragments.filter((f) => !f.isPlaced);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        gap: '16px',
      }}
    >
      <div
        ref={boardRef}
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          backgroundColor: '#3D2B1F',
          borderRadius: '12px',
          position: 'relative',
          margin: '0 auto',
          willChange: 'transform',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            position: 'absolute',
            left: SYNTHESIS_CENTER.x - SYNTHESIS_RADIUS,
            top: SYNTHESIS_CENTER.y - SYNTHESIS_RADIUS,
            width: SYNTHESIS_RADIUS * 2,
            height: SYNTHESIS_RADIUS * 2,
            border: '2px dashed #A0845C',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {displayArtifact && isComplete && renderCompleteArtifact(displayArtifact)}
        {displayArtifact && renderPlacedFragments(displayArtifact)}

        {dragged && (
          <div
            style={{
              position: 'fixed',
              left: dragged.currentX,
              top: dragged.currentY,
              width: dragged.fragment.size,
              height: dragged.fragment.size,
              backgroundColor: dragged.fragment.color,
              clipPath: shapeToPath(dragged.fragment.shape, dragged.fragment.size),
              transform: `rotate(${dragged.fragment.rotation}deg)`,
              pointerEvents: 'none',
              zIndex: 1000,
              opacity: 0.8,
            }}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'rgba(61, 43, 31, 0.6)',
          borderRadius: '8px',
          minHeight: '60px',
          justifyContent: 'center',
        }}
      >
        {unplacedFragments.map((fragment, idx) => {
          const boardRect = boardRef.current?.getBoundingClientRect();
          const startX = boardRect ? boardRect.left + 16 + idx * 50 : 0;
          const startY = boardRect ? boardRect.bottom + 16 : 0;

          return (
            <div
              key={fragment.id}
              className="fragment-item"
              style={{
                width: 40,
                height: 40,
                position: 'relative',
                cursor: fragment.isPlaced ? 'default' : 'grab',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => handleFragmentMouseDown(e, fragment, startX, startY)}
              onTouchStart={(e) => handleTouchStart(e, fragment, startX, startY)}
              onClick={() => rotateFragment(fragment.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: (40 - fragment.size) / 2,
                  top: (40 - fragment.size) / 2,
                  width: fragment.size,
                  height: fragment.size,
                  backgroundColor: fragment.color,
                  clipPath: shapeToPath(fragment.shape, fragment.size),
                  transform: `rotate(${fragment.rotation}deg)`,
                  transition: 'transform 0.2s ease-out',
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px #FFD700);
          }
          50% {
            filter: drop-shadow(0 0 20px #FFA500);
          }
        }
        @keyframes artifactRise {
          0% {
            transform: scale(0) translateY(100px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .fragment-item:active {
          cursor: grabbing;
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default ReconstructionBoard;
