import React from 'react';
import { Track } from './store';

interface StepSequencerProps {
  tracks: Track[];
  grid: boolean[][];
  currentStep: number;
  isPlaying: boolean;
  onToggleCell: (trackIdx: number, stepIdx: number) => void;
}

const instrumentClassNames = ['inst-drums', 'inst-bass', 'inst-guitar', 'inst-keys'];

export const StepSequencer: React.FC<StepSequencerProps> = ({
  tracks,
  grid,
  currentStep,
  isPlaying,
  onToggleCell,
}) => {
  const steps = 16;

  return (
    <div className="step-sequencer">
      <div className="sequencer-header">
        <div className="header-spacer" />
        {Array.from({ length: steps }, (_, i) => (
          <div key={i} className={`step-label ${i % 4 === 0 ? 'beat' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>

      <div className="sequencer-body">
        {tracks.map((track, trackIdx) => (
          <div key={track.id} className="sequencer-row">
            <div className="row-label">
              <span
                className="instrument-badge"
                style={{ backgroundColor: track.color + '20', color: track.color }}
              >
                {track.name}
              </span>
            </div>
            <div className="row-cells">
              {Array.from({ length: steps }, (_, stepIdx) => {
                const isActive = grid[trackIdx]?.[stepIdx] ?? false;
                const isCurrent = stepIdx === currentStep;
                const isBeat = stepIdx % 4 === 0;

                return (
                  <div
                    key={stepIdx}
                    className={`cell 
                      ${isActive ? 'active' : 'inactive'}
                      ${isActive ? instrumentClassNames[trackIdx] : ''}
                      ${isCurrent ? 'current' : ''}
                      ${isBeat ? 'beat-col' : ''}
                    `}
                    style={{
                      '--instrument-color': track.color,
                      '--instrument-color-glow': track.color + '80',
                      '--instrument-color-bright': track.color + 'ff',
                      '--instrument-color-dim': track.color + '40',
                    } as React.CSSProperties}
                    onClick={() => onToggleCell(trackIdx, stepIdx)}
                  >
                    <div className="cell-inner" />
                    {isActive && isCurrent && (
                      <>
                        <div className="ripple" />
                        <div className="flash" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div
          className={`playhead ${isPlaying ? 'playing' : ''}`}
          style={{
            left: `calc(${(currentStep / 16) * 100}% + 80px + ${(currentStep / 16) * 4}px)`,
          }}
        >
          <div className="playhead-line" />
          <div className="playhead-head" />
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;
