import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { NoteName } from '../data/noteData';

export const ChordChallenge: React.FC = () => {
  const { chords, selectChordNote, removeChordSlotNote, resetChords, activeChordIndex, setActiveChordIndex } =
    useAppStore();
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);

  const allCompleted = chords.every((c) => c.completed);

  return (
    <div
      style={{
        background: '#1F2937',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ color: '#F9FAFB', fontSize: '16px', fontWeight: 600 }}>🎸 和弦配对挑战</h2>
        <button
          onClick={resetChords}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #4B5563',
            background: '#374151',
            color: '#9CA3AF',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4B5563')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#374151')}
        >
          重新开始
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          minHeight: '120px',
          alignItems: 'flex-start',
        }}
      >
        {chords.map((chord, ci) => {
          const isActive = ci === activeChordIndex;
          const isRemoving = removingIdx === ci;

          return (
            <div
              key={ci}
              onClick={() => setActiveChordIndex(ci)}
              style={{
                minWidth: '100px',
                width: '100px',
                background: chord.completed ? '#10B981' : isActive ? '#374151' : '#4B5563',
                borderRadius: '12px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                transform: isRemoving
                  ? 'rotate(360deg) scale(0)'
                  : chord.completed
                  ? 'scale(0.95)'
                  : 'scale(1)',
                opacity: isRemoving ? 0 : 1,
                border: isActive && !chord.completed ? '2px solid #3B82F6' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!chord.completed) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!chord.completed) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <p
                style={{
                  color: chord.completed ? '#FFF' : '#F9FAFB',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: '8px',
                }}
              >
                {chord.displayName}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  justifyContent: 'center',
                  minHeight: '28px',
                  marginBottom: '8px',
                }}
              >
                {chord.requiredNotes.map((_, si) => {
                  const placed = chord.placedNotes[si];
                  return (
                    <div
                      key={si}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (placed) removeChordSlotNote(ci, si);
                      }}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: placed ? '#3B82F6' : '#1F2937',
                        border: placed ? 'none' : '1px dashed #6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: placed ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {placed || ''}
                    </div>
                  );
                })}
              </div>

              {!chord.completed && (
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {chord.floatingNotes.map((fn, fi) => (
                    <button
                      key={fi}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectChordNote(ci, fn);
                      }}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#6B7280',
                        color: '#FFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              )}

              {chord.completed && (
                <p style={{ color: '#FFF', fontSize: '11px', textAlign: 'center' }}>✓ 完成</p>
              )}
            </div>
          );
        })}
      </div>

      {allCompleted && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '12px',
            padding: '10px',
            background: '#10B981',
            borderRadius: '10px',
            color: '#FFF',
            fontWeight: 700,
          }}
        >
          🎉 所有和弦配对成功！
        </div>
      )}
    </div>
  );
};
