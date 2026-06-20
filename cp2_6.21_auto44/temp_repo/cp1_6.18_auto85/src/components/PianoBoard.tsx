import { PianoKey } from './PianoKey';

const WHITE_KEY_WIDTH = 60;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEY_POSITIONS: Record<string, number> = {
  'C#': -24,
  'D#': -24,
  'F#': -24,
  'G#': -24,
  'A#': -24,
};

function generate88Keys(): { note: string; isBlack: boolean; whiteIndex: number }[] {
  const keys: { note: string; isBlack: boolean; whiteIndex: number }[] = [];
  let whiteIndex = 0;

  for (let octave = 0; octave <= 8; octave++) {
    for (let i = 0; i < NOTE_NAMES.length; i++) {
      const noteName = NOTE_NAMES[i];
      const midiNote = octave * 12 + i;
      if (midiNote < 9 || midiNote > 96) continue;

      const note = `${noteName}${octave}`;
      const isBlack = noteName.includes('#');
      keys.push({ note, isBlack, whiteIndex: isBlack ? whiteIndex - 1 : whiteIndex });
      if (!isBlack) whiteIndex++;
    }
  }
  return keys;
}

const PIANO_KEYS = generate88Keys();

export function PianoBoard() {
  const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);
  const blackKeys = PIANO_KEYS.filter((k) => k.isBlack);
  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  return (
    <div className="w-full bg-bgKeyboard rounded-xl p-4 overflow-x-auto border border-accentCyan/20">
      <div
        className="relative mx-auto"
        style={{ width: `${totalWidth}px`, height: '200px', minWidth: '100%' }}
      >
        <div className="relative flex h-full">
          {whiteKeys.map((key) => (
            <PianoKey key={key.note} note={key.note} isBlack={false} />
          ))}
        </div>

        <div className="absolute top-0 left-0 h-full pointer-events-none" style={{ width: `${totalWidth}px` }}>
          {blackKeys.map((key) => {
            const whiteKeyIndex = key.whiteIndex;
            const left = (whiteKeyIndex + 1) * WHITE_KEY_WIDTH - 18;
            return (
              <div key={key.note} className="absolute" style={{ left: `${left}px` }}>
                <PianoKey note={key.note} isBlack={true} left={0} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
