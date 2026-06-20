import React, { useEffect, useCallback } from 'react';
import {
  useAudioStore,
  KEYBOARD_ROWS,
  getKeyMapping,
  getNoteColor,
  SCALE,
} from '../stores/audioStore';

const Keyboard: React.FC = () => {
  const activeKeys = useAudioStore((s) => s.activeKeys);
  const currentNote = useAudioStore((s) => s.currentNote);
  const playNote = useAudioStore((s) => s.playNote);
  const stopNote = useAudioStore((s) => s.stopNote);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const mapping = getKeyMapping(e.code);
      if (mapping) {
        e.preventDefault();
        playNote(e.code, 0.8);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mapping = getKeyMapping(e.code);
      if (mapping) {
        e.preventDefault();
        stopNote(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playNote, stopNote]);

  const handleMouseDown = useCallback(
    (keyCode: string) => {
      const mapping = getKeyMapping(keyCode);
      if (mapping) {
        playNote(keyCode, 0.8);
      }
    },
    [playNote]
  );

  const handleMouseUp = useCallback(
    (keyCode: string) => {
      const mapping = getKeyMapping(keyCode);
      if (mapping) {
        stopNote(keyCode);
      }
    },
    [stopNote]
  );

  const handleMouseLeave = useCallback(
    (keyCode: string) => {
      if (activeKeys.has(keyCode)) {
        stopNote(keyCode);
      }
    },
    [activeKeys, stopNote]
  );

  const renderKey = (keyCode: string) => {
    const mapping = getKeyMapping(keyCode);
    const isActive = activeKeys.has(keyCode);
    const isMapped = !!mapping;
    const baseColor = mapping ? getNoteColor(mapping.frequency) : '#3a3a3a';
    const displayLetter = keyCode.replace('Key', '');

    return (
      <div
        key={keyCode}
        className="key"
        onMouseDown={() => handleMouseDown(keyCode)}
        onMouseUp={() => handleMouseUp(keyCode)}
        onMouseLeave={() => handleMouseLeave(keyCode)}
        style={{
          width: 56,
          height: 56,
          margin: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isMapped ? 'pointer' : 'default',
          userSelect: 'none',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s ease',
          transform: isActive ? 'scale(0.95) translateY(2px)' : 'scale(1) translateY(0)',
          backgroundColor: isActive ? baseColor : '#3a3a3a',
          boxShadow: isActive
            ? `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 12px ${baseColor}60`
            : '0 3px 0 #1a1a1a, 0 4px 8px rgba(0,0,0,0.4)',
          color: isActive ? '#1a1a1a' : isMapped ? '#e0e0e0' : '#555',
          fontWeight: 600,
          fontSize: 15,
          position: 'relative',
          border: `1px solid ${isActive ? baseColor : '#4a4a4a'}`,
        }}
      >
        <span style={{ lineHeight: 1 }}>{displayLetter}</span>
        {mapping && (
          <span
            style={{
              fontSize: 9,
              opacity: isActive ? 0.9 : 0.5,
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            {mapping.note}
          </span>
        )}
      </div>
    );
  };

  const hasActiveMapping = Array.from(activeKeys).some((k) => getKeyMapping(k));
  const activeNote = hasActiveMapping ? currentNote : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          backgroundColor: '#2d2d2d',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginLeft: rowIndex * 20,
            }}
          >
            {row.map((keyCode) => renderKey(keyCode))}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          height: 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeNote ? (
          <>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: getNoteColor(activeNote.frequency),
                letterSpacing: 2,
                textShadow: `0 0 20px ${getNoteColor(activeNote.frequency)}60`,
                fontFamily: 'Consolas, Monaco, monospace',
              }}
            >
              {activeNote.note}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#888',
                marginTop: 4,
                fontFamily: 'Consolas, Monaco, monospace',
              }}
            >
              {activeNote.frequency.toFixed(2)} Hz
            </div>
          </>
        ) : (
          <div style={{ color: '#555', fontSize: 14, letterSpacing: 1 }}>
            按下 A S D F G H J 或 W E T Y U 演奏音符
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 11, color: '#666' }}>低音</span>
        <div
          style={{
            width: 200,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(to right, ${SCALE.map((k) => getNoteColor(k.frequency)).join(', ')})`,
          }}
        />
        <span style={{ fontSize: 11, color: '#666' }}>高音</span>
      </div>
    </div>
  );
};

export default Keyboard;
