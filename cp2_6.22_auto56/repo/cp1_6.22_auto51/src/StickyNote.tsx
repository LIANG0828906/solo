import React, { useState, useRef, useEffect } from 'react';
import type { StickyNote as NoteT } from './types';
import { easeOutBack } from './utils';

interface StickyNoteProps {
  note: NoteT;
  onUpdate: (partial: Partial<NoteT>) => void;
  isOwner: boolean;
}

const MIN_W = 120;
const MIN_H = 100;

const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, isOwner }) => {
  const [animProgress, setAnimProgress] = useState(note.animationState?.kind === 'entering' ? 0 : 1);
  const [drag, setDrag] = useState<null | { startX: number; startY: number; origX: number; origY: number }>(null);
  const [resize, setResize] = useState<null | { startX: number; startY: number; origW: number; origH: number }>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note.animationState?.kind === 'entering' && animProgress < 1) {
      let raf = 0;
      const start = note.animationState.startTime;
      const duration = 500;
      const tick = (t: number) => {
        const elapsed = t - start;
        const p = Math.min(1, elapsed / duration);
        setAnimProgress(easeOutBack(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [note.animationState, animProgress]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const pt = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      if (drag) {
        const dx = pt.clientX - drag.startX;
        const dy = pt.clientY - drag.startY;
        onUpdate({
          x: drag.origX + dx,
          y: drag.origY + dy,
        });
      }
      if (resize) {
        const dx = pt.clientX - resize.startX;
        const dy = pt.clientY - resize.startY;
        onUpdate({
          width: Math.max(MIN_W, resize.origW + dx),
          height: Math.max(MIN_H, resize.origH + dy),
        });
      }
    };
    const handleUp = () => {
      if (drag) setDrag(null);
      if (resize) setResize(null);
    };
    if (drag || resize) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };
    }
  }, [drag, resize, onUpdate]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isOwner) return;
    if ((e.target as HTMLElement).dataset.role === 'resize') return;
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    setDrag({
      startX: pt.clientX,
      startY: pt.clientY,
      origX: note.x,
      origY: note.y,
    });
  };

  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isOwner) return;
    e.stopPropagation();
    const pt = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    setResize({
      startX: pt.clientX,
      startY: pt.clientY,
      origW: note.width,
      origH: note.height,
    });
  };

  const scale = 0.6 + animProgress * 0.4;
  const opacity = animProgress;
  const shadow = `0 ${10 + animProgress * 18}px ${30 + animProgress * 20}px rgba(0,0,0,${0.25 + animProgress * 0.2}), 0 0 0 1px rgba(0,0,0,0.08)`;

  return (
    <>
      <style>{componentCSS}</style>
      <div
        className={`sticky-note ${isOwner ? 'owner' : 'remote'}`}
        style={{
          left: note.x,
          top: note.y,
          width: note.width,
          height: note.height,
          transform: `scale(${scale}) rotate(${(1 - animProgress) * -4}deg)`,
          transformOrigin: 'center center',
          opacity,
          boxShadow: shadow,
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="tape" />
        <textarea
          ref={textRef}
          className="note-text"
          value={note.text}
          placeholder={isOwner ? '写点什么…' : ''}
          readOnly={!isOwner}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        />
        <div
          className="resize-handle"
          data-role="resize"
          onMouseDown={startResize}
          onTouchStart={startResize}
          style={{ visibility: isOwner ? 'visible' : 'hidden' }}
        />
      </div>
    </>
  );
};

const componentCSS = `
.sticky-note {
  position: absolute;
  background: linear-gradient(160deg, #fff8dc 0%, #fff1b8 100%);
  border-radius: 4px;
  overflow: hidden;
  user-select: none;
  transition: box-shadow 0.25s, filter 0.2s;
  will-change: transform, opacity;
}
.sticky-note::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 18px, rgba(0,0,0,0.025) 18px 19px),
    repeating-linear-gradient(0deg, transparent 0 22px, rgba(0,0,0,0.02) 22px 23px);
  pointer-events: none;
}
.sticky-note:hover { filter: brightness(1.02); }
.sticky-note.remote { filter: brightness(0.95) saturate(0.9); }

.tape {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 60px;
  height: 20px;
  background: rgba(233, 69, 96, 0.22);
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.note-text {
  position: absolute;
  inset: 16px 14px 18px 14px;
  width: calc(100% - 28px);
  height: calc(100% - 34px);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Kalam', 'Comic Sans MS', 'Space Grotesk', cursive, sans-serif;
  font-size: 15px;
  line-height: 22px;
  color: #3a2e10;
  letter-spacing: 0.2px;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}
.note-text::placeholder { color: rgba(58, 46, 16, 0.35); }

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 22px;
  height: 22px;
  cursor: se-resize;
  background:
    linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.15) 56%, transparent 56%, transparent 66%, rgba(0,0,0,0.15) 66%, rgba(0,0,0,0.15) 72%, transparent 72%);
  opacity: 0;
  transition: opacity 0.2s;
}
.sticky-note:hover .resize-handle { opacity: 1; }
@media (max-width: 767px) {
  .resize-handle {
    opacity: 1;
    width: 30px;
    height: 30px;
  }
  .note-text { font-size: 16px; }
}
`;

export default StickyNote;
