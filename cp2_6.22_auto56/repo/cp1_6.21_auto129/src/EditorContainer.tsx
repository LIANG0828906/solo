import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { User, EditEvent, EditorHandle } from './types';

interface CursorVisual {
  userId: string;
  left: number;
  top: number;
  height: number;
  color: string;
  name: string;
}

interface Props {
  content: string;
  events: EditEvent[];
  users: User[];
  cursors: Map<string, number>;
}

const EditorContainer = forwardRef<EditorHandle, Props>(
  ({ content, events, users, cursors }, ref) => {
    const quillRef = useRef<Quill | null>(null);
    const editorElRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [cursorVisuals, setCursorVisuals] = useState<CursorVisual[]>([]);
    const [highlight, setHighlight] = useState<{
      left: number;
      top: number;
      width: number;
      height: number;
    } | null>(null);
    const appliedEventsRef = useRef<Set<string>>(new Set());
    const isApplyingRef = useRef(false);

    useEffect(() => {
      if (!editorElRef.current) return;
      if (quillRef.current) return;

      const q = new Quill(editorElRef.current, {
        theme: 'snow',
        readOnly: false,
        placeholder: '开始编辑...',
        modules: {
          toolbar: false,
        },
      });

      const htmlContent = content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');

      q.root.innerHTML = htmlContent;
      quillRef.current = q;
    }, []);

    useEffect(() => {
      if (!quillRef.current || events.length === 0) return;
      const quill = quillRef.current;
      const applied = appliedEventsRef.current;
      const newEvents = events.filter(e => !applied.has(e.id));
      if (newEvents.length === 0) return;

      isApplyingRef.current = true;
      quill.disable();

      for (const evt of newEvents) {
        try {
          if (evt.type === 'insert') {
            const pos = Math.min(evt.position, quill.getLength() - 1);
            quill.insertText(pos, evt.text, 'silent');
          } else if (evt.type === 'delete') {
            const pos = Math.min(evt.position, quill.getLength() - 1);
            const len = Math.min(evt.text.length, quill.getLength() - 1 - pos);
            if (len > 0) {
              quill.deleteText(pos, len, 'silent');
            }
          }
          applied.add(evt.id);
        } catch (err) {
          applied.add(evt.id);
        }
      }

      quill.enable();
      isApplyingRef.current = false;
    }, [events]);

    const recalcCursors = useCallback(() => {
      const quill = quillRef.current;
      if (!quill) return;

      const scrollTop = quill.root.scrollTop;
      const editorHeight = quill.root.clientHeight;
      const visuals: CursorVisual[] = [];

      cursors.forEach((position, userId) => {
        const user = users.find(u => u.id === userId);
        if (!user || !user.online) return;
        try {
          const safePos = Math.min(position, quill.getLength() - 1);
          const bounds = quill.getBounds(safePos);
          if (
            bounds.top - scrollTop < -50 ||
            bounds.top - scrollTop > editorHeight + 50
          ) {
            return;
          }
          visuals.push({
            userId,
            left: bounds.left,
            top: bounds.top - scrollTop,
            height: bounds.bottom - bounds.top,
            color: user.color,
            name: user.name,
          });
        } catch {}
      });

      setCursorVisuals(visuals);
    }, [cursors, users]);

    useEffect(() => {
      const quill = quillRef.current;
      if (!quill) return;

      recalcCursors();

      const onScroll = () => {
        requestAnimationFrame(recalcCursors);
      };
      quill.root.addEventListener('scroll', onScroll);
      return () => quill.root.removeEventListener('scroll', onScroll);
    }, [recalcCursors]);

    useEffect(() => {
      const id = requestAnimationFrame(recalcCursors);
      return () => cancelAnimationFrame(id);
    }, [cursors, recalcCursors]);

    useImperativeHandle(ref, () => ({
      scrollToPosition: (position: number, length: number) => {
        const quill = quillRef.current;
        if (!quill) return;

        quill.setSelection(position, 0, 'silent');

        setTimeout(() => {
          try {
            const safePos = Math.min(position, quill.getLength() - 1);
            const safeEnd = Math.min(position + length, quill.getLength() - 1);
            const startBounds = quill.getBounds(safePos);
            const scrollTop = quill.root.scrollTop;

            if (startBounds.top < scrollTop || startBounds.bottom > scrollTop + quill.root.clientHeight) {
              quill.root.scrollTop = startBounds.top - quill.root.clientHeight / 3;
            }

            setTimeout(() => {
              try {
                const b1 = quill.getBounds(safePos);
                const b2 = quill.getBounds(safeEnd);
                const st = quill.root.scrollTop;
                setHighlight({
                  left: b1.left,
                  top: b1.top - st,
                  width: Math.max(b2.right - b1.left, 30),
                  height: b2.bottom - b1.top,
                });
                setTimeout(() => setHighlight(null), 1600);
              } catch {}
            }, 100);
          } catch {}
        }, 50);
      },
      getQuill: () => quillRef.current,
    }));

    return (
      <div className="editor-wrapper">
        <div ref={editorElRef} style={{ height: '100%' }} />

        <div ref={overlayRef} className="cursor-overlay">
          {cursorVisuals.map(cv => (
            <div
              key={cv.userId}
              className="remote-cursor"
              style={{
                left: cv.left,
                top: cv.top,
                height: cv.height,
              }}
            >
              <div
                className="cursor-line"
                style={{
                  backgroundColor: cv.color,
                  height: cv.height,
                }}
              />
              <div
                className="cursor-glow"
                style={{ backgroundColor: cv.color }}
              />
              <div
                className="cursor-label"
                style={{ backgroundColor: cv.color }}
              >
                {cv.name}
              </div>
            </div>
          ))}

          {highlight && (
            <div
              className="highlight-block"
              style={{
                left: highlight.left,
                top: highlight.top,
                width: highlight.width,
                height: highlight.height,
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

EditorContainer.displayName = 'EditorContainer';

export default EditorContainer;
