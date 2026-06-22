import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  outer: {
    flex: 1,
    height: 10,
    background: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  inner: (progress: number): React.CSSProperties => ({
    height: '100%',
    width: `${Math.min(100, Math.max(0, progress))}%`,
    background: 'linear-gradient(90deg, #3A7BD5, #1B3A5C)',
    borderRadius: 5,
    transition: 'width 0.3s ease',
  }),
  label: {
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#1B3A5C',
    minWidth: 36,
    textAlign: 'right' as const,
  },
};

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.outer}>
        <div style={styles.inner(progress)} />
      </div>
      <span style={styles.label}>{progress}%</span>
    </div>
  );
}
