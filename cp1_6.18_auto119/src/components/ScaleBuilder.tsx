import React from 'react';
import { useAppStore } from '../stores/appStore';
import { ALL_NOTE_NAMES, NoteName } from '../data/noteData';

export const ScaleBuilder: React.FC = () => {
  const { currentScale, scaleUserNotes, scaleCompleted, selectScaleNote, resetScale } = useAppStore();

  return (
    <div
      style={{
        width: '280px',
        background: '#1F2937',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      <h2 style={{ color: '#F9FAFB', fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
        🎹 音阶构建
      </h2>

      <div
        style={{
          background: '#111827',
          borderRadius: '12px',
          padding: '14px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>当前调式</p>
        <p style={{ color: '#3B82F6', fontSize: '22px', fontWeight: 700 }}>
          {currentScale.name}
        </p>
      </div>

      <div
        style={{
          background: '#111827',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>你的音阶</p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', minHeight: '40px', alignItems: 'center' }}>
          {scaleUserNotes.length === 0 && (
            <span style={{ color: '#4B5563', fontSize: '13px' }}>点击下方音名开始...</span>
          )}
          {scaleUserNotes.map((note, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: scaleCompleted ? '#10B981' : '#3B82F6',
                color: '#FFF',
                fontSize: '14px',
                fontWeight: 600,
                animation: 'notePop 0.3s ease',
              }}
            >
              {note}
            </span>
          ))}
          {!scaleCompleted && scaleUserNotes.length < 7 && (
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '2px dashed #4B5563',
              }}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
        {ALL_NOTE_NAMES.map((name) => {
          const isUsed = scaleUserNotes.includes(name);
          return (
            <button
              key={name}
              onClick={() => selectScaleNote(name)}
              disabled={scaleCompleted}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: isUsed
                  ? scaleCompleted
                    ? '#10B981'
                    : '#3B82F6'
                  : '#374151',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 600,
                cursor: scaleCompleted ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: scaleCompleted && !isUsed ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!scaleCompleted) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseDown={(e) => {
                if (!scaleCompleted) e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {name}
            </button>
          );
        })}
      </div>

      <button
        onClick={resetScale}
        style={{
          padding: '10px',
          borderRadius: '10px',
          border: 'none',
          background: scaleCompleted ? '#10B981' : '#4B5563',
          color: '#FFF',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {scaleCompleted ? '🎉 再来一次' : '换一个调式'}
      </button>
    </div>
  );
};
