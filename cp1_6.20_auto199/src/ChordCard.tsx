import React from 'react';
import { ChordData, InstrumentData, getChordColor, getChordGradient } from './data';

interface ChordCardProps {
  chord: ChordData | null;
  instrument: InstrumentData;
  flipped: boolean;
  onFlip: () => void;
}

export default function ChordCard({ chord, instrument, flipped, onFlip }: ChordCardProps) {
  if (!chord) {
    return (
      <div className="chord-card-placeholder">
        <div className="placeholder-icon">🎵</div>
        <div className="placeholder-text">选择一个和弦</div>
      </div>
    );
  }

  const [gradStart, gradEnd] = getChordGradient(chord.type);
  const isMinor = chord.type === 'minor' || chord.type === 'minor7';

  return (
    <div className="chord-card-wrapper" onClick={onFlip}>
      <div className={`chord-card ${flipped ? 'flipped' : ''}`}>
        <div
          className="chord-card-face chord-card-front"
          style={{
            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
          }}
        >
          <div className="card-chord-name">{chord.name}</div>
          <div className="card-chord-type">
            {chord.type === 'major' && '大三和弦'}
            {chord.type === 'minor' && '小三和弦'}
            {chord.type === 'dominant7' && '属七和弦'}
            {chord.type === 'major7' && '大七和弦'}
            {chord.type === 'minor7' && '小七和弦'}
          </div>

          <div className="card-mini-fretboard">
            <svg
              viewBox={`0 0 ${instrument.stringCount * 28 + 16} ${(instrument.fretCount + 1) * 24 + 8}`}
              className="mini-fretboard-svg"
            >
              <rect
                x="8"
                y="2"
                width={instrument.stringCount * 28}
                height="3"
                fill="#f5deb3"
                rx="1"
              />
              {Array.from({ length: instrument.fretCount }, (_, i) => (
                <line
                  key={`fret-${i}`}
                  x1="8"
                  y1={8 + (i + 1) * 24}
                  x2={8 + (instrument.stringCount - 1) * 28}
                  y2={8 + (i + 1) * 24}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: instrument.stringCount }, (_, i) => (
                <line
                  key={`string-${i}`}
                  x1={8 + i * 28}
                  y1="5"
                  x2={8 + i * 28}
                  y2={8 + instrument.fretCount * 24}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.2 - i * 0.15}
                />
              ))}
              {chord.openStrings.map((s) => (
                <circle
                  key={`open-${s}`}
                  cx={8 + s * 28}
                  cy={-2}
                  r="4"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
              {chord.mutedStrings.map((s) => (
                <g key={`muted-${s}`}>
                  <line
                    x1={8 + s * 28 - 4}
                    y1={-6}
                    x2={8 + s * 28 + 4}
                    y2={2}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={8 + s * 28 + 4}
                    y1={-6}
                    x2={8 + s * 28 - 4}
                    y2={2}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </g>
              ))}
              {chord.positions.map((pos) => (
                <g key={`pos-${pos.string}-${pos.fret}`}>
                  <circle
                    cx={8 + pos.string * 28}
                    cy={8 + (pos.fret - 0.5) * 24}
                    r="8"
                    fill="white"
                  />
                  <text
                    x={8 + pos.string * 28}
                    y={8 + (pos.fret - 0.5) * 24 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isMinor ? '#2d6a6a' : '#8b4513'}
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="Outfit, sans-serif"
                  >
                    {pos.finger}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="card-flip-hint">点击翻转</div>
        </div>

        <div className="chord-card-face chord-card-back">
          <div className="back-chord-name" style={{ color: getChordColor(chord.type) }}>
            {chord.name}
          </div>
          <div className="back-section">
            <div className="back-label">构成音</div>
            <div className="back-notes">
              {chord.notes.map((note, i) => (
                <span key={note} className="back-note-chip" style={{ borderColor: getChordColor(chord.type) }}>
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div className="back-section">
            <div className="back-label">音程关系</div>
            <div className="back-intervals">
              {chord.intervals.map((interval) => (
                <span key={interval} className="back-interval-chip">
                  {interval}
                </span>
              ))}
            </div>
          </div>
          <div className="back-section">
            <div className="back-label">空弦音</div>
            <div className="back-tuning">
              {instrument.tuning.map((t, i) => (
                <span
                  key={t}
                  className={`back-tuning-note ${
                    chord.mutedStrings.includes(i) ? 'muted' : chord.openStrings.includes(i) ? 'open' : ''
                  }`}
                >
                  {chord.mutedStrings.includes(i) ? '✕' : t}
                </span>
              ))}
            </div>
          </div>
          <div className="card-flip-hint">点击翻转</div>
        </div>
      </div>
    </div>
  );
}
