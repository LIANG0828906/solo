import React, { useRef, useState, useCallback } from 'react';
import { FaChevronRight, FaPlus, FaMusic } from 'react-icons/fa';
import type { Fragment, Note } from '../types';

interface ScoreEditorProps {
  fragments: Fragment[];
  onFragmentsChange: (fragments: Fragment[]) => void;
  currentPlayTime: number | null;
  activeFragmentId: string | null;
  onActiveFragmentChange: (id: string) => void;
}

const PITCH_MIN = 60;
const PITCH_MAX = 83;
const PITCH_RANGE = PITCH_MAX - PITCH_MIN;
const NOTE_START_X = 20;
const NOTE_X_PER_BEAT = 60;
const NOTE_Y_TOP = 20;
const NOTE_Y_PER_SEMITONE = 10;
const MIN_DURATION = 0.125;
const GRID_HEIGHT = (PITCH_RANGE + 1) * NOTE_Y_PER_SEMITONE + NOTE_Y_TOP * 2;

function getPitchColor(pitch: number): 'low' | 'mid' | 'high' {
  if (pitch < 65) return 'low';
  if (pitch < 74) return 'mid';
  return 'high';
}

function getFragmentDuration(fragment: Fragment): number {
  if (fragment.notes.length === 0) return 0;
  const maxEnd = Math.max(...fragment.notes.map(n => n.startTime + n.duration));
  return Math.ceil(maxEnd * 100) / 100;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const ScoreEditor: React.FC<ScoreEditorProps> = ({
  fragments,
  onFragmentsChange,
  currentPlayTime,
  activeFragmentId,
  onActiveFragmentChange,
}) => {
  const [dragging, setDragging] = useState<{
    fragmentId: string;
    noteId: string;
    startX: number;
    startY: number;
    origStartTime: number;
    origPitch: number;
    origDuration: number;
    mode: 'move' | 'resize';
  } | null>(null);

  const areaRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleNoteMouseDown = useCallback((
    e: React.MouseEvent,
    fragmentId: string,
    note: Note,
    mode: 'move' | 'resize',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onActiveFragmentChange(fragmentId);
    setDragging({
      fragmentId,
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origStartTime: note.startTime,
      origPitch: note.pitch,
      origDuration: note.duration,
      mode,
    });
  }, [onActiveFragmentChange]);

  React.useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragging.startX;
      const deltaY = e.clientY - dragging.startY;

      onFragmentsChange(fragments.map(f => {
        if (f.id !== dragging.fragmentId) return f;
        return {
          ...f,
          notes: f.notes.map(n => {
            if (n.id !== dragging.noteId) return n;

            if (dragging.mode === 'move') {
              const newStartTime = Math.max(0, Math.round(
                (dragging.origStartTime + deltaX / NOTE_X_PER_BEAT) / MIN_DURATION
              ) * MIN_DURATION);
              const newPitch = Math.min(
                PITCH_MAX,
                Math.max(PITCH_MIN, dragging.origPitch - Math.round(deltaY / NOTE_Y_PER_SEMITONE))
              );
              return { ...n, startTime: newStartTime, pitch: newPitch };
            } else {
              const newDuration = Math.max(
                MIN_DURATION,
                Math.round(
                  (dragging.origDuration + deltaX / NOTE_X_PER_BEAT) / MIN_DURATION
                ) * MIN_DURATION
              );
              return { ...n, duration: newDuration };
            }
          }),
        };
      }));
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, fragments, onFragmentsChange]);

  const toggleFragment = (fragmentId: string) => {
    onFragmentsChange(fragments.map(f =>
      f.id === fragmentId ? { ...f, expanded: !f.expanded } : f
    ));
  };

  const updateFragmentName = (fragmentId: string, name: string) => {
    const trimmed = name.slice(0, 12);
    onFragmentsChange(fragments.map(f =>
      f.id === fragmentId ? { ...f, name: trimmed } : f
    ));
  };

  const addFragment = () => {
    const newFragment: Fragment = {
      id: generateId(),
      name: `片段 ${fragments.length + 1}`,
      notes: [],
      expanded: true,
    };
    onFragmentsChange([...fragments, newFragment]);
    onActiveFragmentChange(newFragment.id);
  };

  if (fragments.length === 0) {
    return (
      <div className="score-editor">
        <div className="score-editor-inner">
          <div className="empty-score">
            <FaMusic className="empty-score-icon" />
            <div className="empty-score-text">点击下方按钮创建第一个灵感片段</div>
          </div>
          <button className="fragment-add-btn" onClick={addFragment}>
            <FaPlus /> 创建灵感片段
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="score-editor">
      <div className="score-editor-inner">
        {fragments.map((fragment) => {
          const duration = getFragmentDuration(fragment);
          const areaWidth = Math.max(600, (duration + 4) * NOTE_X_PER_BEAT + NOTE_START_X);

          return (
            <div key={fragment.id} className="fragment-container">
              <div
                className="fragment-header"
                onClick={() => toggleFragment(fragment.id)}
              >
                <FaChevronRight
                  className={`fragment-expand-icon ${fragment.expanded ? 'expanded' : ''}`}
                />
                <input
                  className="fragment-name"
                  value={fragment.name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateFragmentName(fragment.id, e.target.value)}
                  maxLength={12}
                />
                <span className="fragment-duration">{duration.toFixed(2)}s</span>
                <span className="fragment-duration">{fragment.notes.length} 音符</span>
              </div>

              {fragment.expanded && (
                <div
                  className="notes-area"
                  ref={(el) => {
                    if (el) areaRefs.current.set(fragment.id, el);
                  }}
                  style={{ height: GRID_HEIGHT, minWidth: areaWidth }}
                >
                  {fragment.notes.map((note) => {
                    const x = NOTE_START_X + note.startTime * NOTE_X_PER_BEAT;
                    const y = NOTE_Y_TOP + (PITCH_MAX - note.pitch) * NOTE_Y_PER_SEMITONE;
                    const color = getPitchColor(note.pitch);
                    const isDragging = dragging?.fragmentId === fragment.id && dragging?.noteId === note.id;

                    return (
                      <React.Fragment key={note.id}>
                        <div
                          className={`note-dot ${color} ${isDragging ? 'dragging' : ''}`}
                          style={{ left: x, top: y }}
                          onMouseDown={(e) => handleNoteMouseDown(e, fragment.id, note, 'move')}
                        />
                        <div
                          className={`note-duration-bar ${color}`}
                          style={{
                            left: x,
                            top: y,
                            width: note.duration * NOTE_X_PER_BEAT - 20,
                          }}
                          onMouseDown={(e) => handleNoteMouseDown(e, fragment.id, note, 'resize')}
                        />
                      </React.Fragment>
                    );
                  })}

                  {currentPlayTime !== null && activeFragmentId === fragment.id && (
                    <div
                      className="playhead"
                      style={{ left: NOTE_START_X + currentPlayTime * NOTE_X_PER_BEAT }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button className="fragment-add-btn" onClick={addFragment}>
          <FaPlus /> 新建灵感片段
        </button>
      </div>
    </div>
  );
};

export default ScoreEditor;
