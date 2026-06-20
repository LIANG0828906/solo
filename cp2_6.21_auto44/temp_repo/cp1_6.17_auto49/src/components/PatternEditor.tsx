import React from 'react';
import { BeatType, BeatPattern, ACCENT_COLOR, NORMAL_COLOR, MUTE_COLOR, PRIMARY_COLOR } from '../types';

interface PatternEditorProps {
  patterns: BeatPattern[];
  activePatternId: string;
  onPatternChange: (patternId: string) => void;
  onBeatChange: (patternId: string, beatIndex: number, beatType: BeatType) => void;
  patternLength: number;
  onPatternLengthChange: (length: number) => void;
}

const beatTypeOrder: BeatType[] = ['accent', 'normal', 'mute'];

const PatternEditor: React.FC<PatternEditorProps> = ({
  patterns,
  activePatternId,
  onPatternChange,
  onBeatChange,
  patternLength,
  onPatternLengthChange,
}) => {
  const activePattern = patterns.find((p) => p.id === activePatternId);

  const cycleBeatType = (beatIndex: number) => {
    if (!activePattern) return;
    const currentType = activePattern.beats[beatIndex];
    const currentIndex = beatTypeOrder.indexOf(currentType);
    const nextType = beatTypeOrder[(currentIndex + 1) % beatTypeOrder.length];
    onBeatChange(activePatternId, beatIndex, nextType);
  };

  const getBeatColor = (type: BeatType): string => {
    switch (type) {
      case 'accent':
        return ACCENT_COLOR;
      case 'normal':
        return NORMAL_COLOR;
      case 'mute':
        return MUTE_COLOR;
    }
  };

  const getBeatLabel = (type: BeatType): string => {
    switch (type) {
      case 'accent':
        return '重';
      case 'normal':
        return '弱';
      case 'mute':
        return '静';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>节奏模式</span>
      </div>

      <div style={styles.patternSelector}>
        <select
          value={activePatternId}
          onChange={(e) => onPatternChange(e.target.value)}
          style={styles.select}
        >
          {patterns.map((pattern) => (
            <option key={pattern.id} value={pattern.id}>
              {pattern.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.beatsGrid}>
        {activePattern?.beats.map((beat, index) => (
          <button
            key={index}
            onClick={() => cycleBeatType(index)}
            style={{
              ...styles.beatCell,
              backgroundColor: getBeatColor(beat),
              transform: index === 0 ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <span style={styles.beatLabel}>{getBeatLabel(beat)}</span>
            <span style={styles.beatNumber}>{index + 1}</span>
          </button>
        ))}
      </div>

      <div style={styles.lengthControl}>
        <span style={styles.lengthLabel}>拍数: {patternLength}</span>
        <div style={styles.lengthButtons}>
          <button
            onClick={() => onPatternLengthChange(patternLength - 1)}
            disabled={patternLength <= 4}
            style={{
              ...styles.lengthButton,
              opacity: patternLength <= 4 ? 0.5 : 1,
            }}
          >
            -
          </button>
          <button
            onClick={() => onPatternLengthChange(patternLength + 1)}
            disabled={patternLength >= 12}
            style={{
              ...styles.lengthButton,
              opacity: patternLength >= 12 ? 0.5 : 1,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: ACCENT_COLOR }} />
          <span style={styles.legendText}>重音</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: NORMAL_COLOR }} />
          <span style={styles.legendText}>弱音</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, backgroundColor: MUTE_COLOR }} />
          <span style={styles.legendText}>静音</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  header: {
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  patternSelector: {
    marginBottom: '16px',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out',
  },
  beatsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
    justifyContent: 'flex-start',
  },
  beatCell: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
    color: '#fff',
    fontWeight: 600,
    position: 'relative',
  },
  beatLabel: {
    fontSize: '14px',
  },
  beatNumber: {
    fontSize: '10px',
    opacity: 0.8,
  },
  lengthControl: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  lengthLabel: {
    fontSize: '13px',
    color: '#666',
  },
  lengthButtons: {
    display: 'flex',
    gap: '8px',
  },
  lengthButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#333',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #eee',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  legendText: {
    fontSize: '12px',
    color: '#666',
  },
};

export default PatternEditor;
