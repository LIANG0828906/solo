import React from 'react';
import { ParsedNote } from '../utils/parser';

interface StaffViewProps {
  notes: ParsedNote[];
  currentNoteIndex: number;
  playProgress: number;
}

const MIDDLE_C_MIDI = 60;
const STAFF_LINE_SPACING = 10;
const NOTE_HEAD_WIDTH = 14;
const NOTE_HEAD_HEIGHT = 10;
const STAFF_START_X = 50;
const NOTE_SPACING = 45;

const TREBLE_CLEF_TOP_Y = 80;
const BASS_CLEF_TOP_Y = 200;

function midiToStaffY(midiNumber: number, isTreble: boolean): number | null {
  if (isTreble) {
    if (midiNumber < 60) return null;
    const topLineMidi = 77;
    const stepsFromTop = topLineMidi - midiNumber;
    return TREBLE_CLEF_TOP_Y + stepsFromTop * (STAFF_LINE_SPACING / 2);
  } else {
    if (midiNumber >= 60) return null;
    const topLineMidi = 55;
    const stepsFromTop = topLineMidi - midiNumber;
    return BASS_CLEF_TOP_Y + stepsFromTop * (STAFF_LINE_SPACING / 2);
  }
}

const StaffView: React.FC<StaffViewProps> = ({ notes, currentNoteIndex, playProgress }) => {
  const staffWidth = Math.max(900, notes.length * NOTE_SPACING + 150);
  const svgHeight = 320;

  const renderStaffLines = (topY: number) => {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      lines.push(
        <line
          key={`line-${topY}-${i}`}
          x1={30}
          y1={topY + i * STAFF_LINE_SPACING}
          x2={staffWidth - 20}
          y2={topY + i * STAFF_LINE_SPACING}
          stroke="#444"
          strokeWidth="1"
        />
      );
    }
    return lines;
  };

  const renderTrebleClef = () => (
    <text
      x={35}
      y={TREBLE_CLEF_TOP_Y + 35}
      fontSize="50"
      fill="#ECF0F1"
      fontFamily="serif"
    >
      𝄞
    </text>
  );

  const renderBassClef = () => (
    <text
      x={38}
      y={BASS_CLEF_TOP_Y + 30}
      fontSize="40"
      fill="#ECF0F1"
      fontFamily="serif"
    >
      𝄢
    </text>
  );

  const renderNote = (note: ParsedNote, index: number, isTreble: boolean) => {
    const y = midiToStaffY(note.midiNumber, isTreble);
    if (y === null) return null;

    const x = STAFF_START_X + index * NOTE_SPACING;
    const isCurrent = index === currentNoteIndex;
    const color = isTreble ? '#E74C3C' : '#2980B9';

    const staffTop = isTreble ? TREBLE_CLEF_TOP_Y : BASS_CLEF_TOP_Y;
    const staffBottom = staffTop + 4 * STAFF_LINE_SPACING;
    const middleLineY = staffTop + 2 * STAFF_LINE_SPACING;
    const stemUp = y > middleLineY;

    const stemX = x + NOTE_HEAD_WIDTH / 2;
    const stemStartY = stemUp ? y - 2 : y + 2;
    const stemEndY = stemUp ? y - 35 : y + 35;

    const ledgerLines: React.ReactElement[] = [];
    if (isTreble) {
      if (note.midiNumber <= 60) {
        ledgerLines.push(
          <line
            key={`ledger-c-${index}`}
            x1={x - 5}
            y1={TREBLE_CLEF_TOP_Y + 5 * STAFF_LINE_SPACING}
            x2={x + NOTE_HEAD_WIDTH + 5}
            y2={TREBLE_CLEF_TOP_Y + 5 * STAFF_LINE_SPACING}
            stroke="#444"
            strokeWidth="1"
          />
        );
      }
    } else {
      if (note.midiNumber >= 59) {
        ledgerLines.push(
          <line
            key={`ledger-c-${index}`}
            x1={x - 5}
            y1={BASS_CLEF_TOP_Y - STAFF_LINE_SPACING}
            x2={x + NOTE_HEAD_WIDTH + 5}
            y2={BASS_CLEF_TOP_Y - STAFF_LINE_SPACING}
            stroke="#444"
            strokeWidth="1"
          />
        );
      }
    }

    return (
      <g key={`note-${isTreble ? 't' : 'b'}-${index}`} className="note-animate">
        {ledgerLines}
        <ellipse
          cx={x + NOTE_HEAD_WIDTH / 2}
          cy={y}
          rx={NOTE_HEAD_WIDTH / 2}
          ry={NOTE_HEAD_HEIGHT / 2}
          fill={color}
          stroke={isCurrent ? '#F39C12' : 'none'}
          strokeWidth={isCurrent ? 2 : 0}
          opacity={isCurrent ? 1 : 0.9}
          style={{
            filter: isCurrent ? 'drop-shadow(0 0 6px #F39C12)' : 'none',
            transition: 'all 0.1s ease',
          }}
        />
        <line
          x1={stemX}
          y1={stemStartY}
          x2={stemX}
          y2={stemEndY}
          stroke={color}
          strokeWidth="1.5"
        />
        {isCurrent && (
          <text
            x={x + NOTE_HEAD_WIDTH / 2}
            y={y - 45}
            fill="#F39C12"
            fontSize="10"
            textAnchor="middle"
          >
            {note.note}
          </text>
        )}
      </g>
    );
  };

  const progressX = STAFF_START_X + notes.length * NOTE_SPACING * playProgress;

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#0D0D0D',
        borderRadius: '8px',
        overflow: 'auto',
        minHeight: '300px',
        padding: '8px',
      }}
      className="staff-container"
    >
      <svg
        width={staffWidth}
        height={svgHeight}
        style={{ display: 'block', minWidth: '100%' }}
      >
        {renderStaffLines(TREBLE_CLEF_TOP_Y)}
        {renderStaffLines(BASS_CLEF_TOP_Y)}
        {renderTrebleClef()}
        {renderBassClef()}

        {notes.length > 0 && playProgress > 0 && (
          <line
            x1={progressX + NOTE_HEAD_WIDTH / 2}
            y1={TREBLE_CLEF_TOP_Y - 20}
            x2={progressX + NOTE_HEAD_WIDTH / 2}
            y2={BASS_CLEF_TOP_Y + 4 * STAFF_LINE_SPACING + 20}
            stroke="#F39C12"
            strokeWidth="2"
            opacity="0.5"
          />
        )}

        {notes.map((note, index) => (
          <React.Fragment key={`note-group-${index}`}>
            {renderNote(note, index, true)}
            {renderNote(note, index, false)}
          </React.Fragment>
        ))}
      </svg>

      <style>{`
        @media (max-width: 768px) {
          .staff-container {
            min-height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffView;
