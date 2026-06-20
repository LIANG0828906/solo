import { ScoreProject, VoiceData, Note, durationToBeats } from '../store/scoreStore';

const PITCH_MAP: Record<string, { step: string; octave: number; alter: number }> = {
  'C': { step: 'C', octave: 4, alter: 0 },
  'D': { step: 'D', octave: 4, alter: 0 },
  'E': { step: 'E', octave: 4, alter: 0 },
  'F': { step: 'F', octave: 4, alter: 0 },
  'G': { step: 'G', octave: 4, alter: 0 },
  'A': { step: 'A', octave: 4, alter: 0 },
  'B': { step: 'B', octave: 4, alter: 0 }
};

const DURATION_TO_DIVISIONS: Record<string, number> = {
  'w': 4096,
  'h': 2048,
  'q': 1024,
  '8': 512,
  '16': 256
};

const DURATION_TO_TYPE: Record<string, string> = {
  'w': 'whole',
  'h': 'half',
  'q': 'quarter',
  '8': 'eighth',
  '16': '16th'
};

function pitchToStepOctave(pitch: string): { step: string; octave: number } {
  const match = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) return { step: 'C', octave: 4 };
  return { step: match[1], octave: parseInt(match[3]) };
}

function noteAlter(accidental: string | null): number {
  if (accidental === '#') return 1;
  if (accidental === 'b') return -1;
  return 0;
}

export function exportToMXL(project: ScoreProject): string {
  const { keySignature, timeSignature, tempo, voices, totalMeasures } = project;
  const beats = parseInt(timeSignature.split('/')[0]);
  const beatType = parseInt(timeSignature.split('/')[1]);
  const fifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'].indexOf(keySignature);
  const adjustedFifths = fifths > 6 ? fifths - 12 : fifths;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!DOCTYPE score-partwise PUBLIC\n`;
  xml += `  "-//Recordare//DTD MusicXML 3.1 Partwise//EN"\n`;
  xml += `  "http://www.musicxml.org/dtds/partwise.dtd">\n`;
  xml += `<score-partwise version="3.1">\n`;
  xml += `  <work>\n`;
  xml += `    <work-title>${project.name}</work-title>\n`;
  xml += `  </work>\n`;
  xml += `  <identification>\n`;
  xml += `    <encoding>\n`;
  xml += `      <software>Music Score Editor</software>\n`;
  xml += `    </encoding>\n`;
  xml += `  </identification>\n`;
  xml += `  <part-list>\n`;

  const clefForVoice: Record<string, { sign: string; line: number }> = {
    'Soprano': { sign: 'G', line: 2 },
    'Alto': { sign: 'G', line: 2 },
    'Tenor': { sign: 'F', line: 4 },
    'Bass': { sign: 'F', line: 4 }
  };

  voices.forEach((voice, idx) => {
    const id = `P${idx + 1}`;
    xml += `    <score-part id="${id}">\n`;
    xml += `      <part-name>${voice.name}</part-name>\n`;
    xml += `      <part-abbreviation>${voice.name.charAt(0)}</part-abbreviation>\n`;
    xml += `    </score-part>\n`;
  });

  xml += `  </part-list>\n`;

  voices.forEach((voiceData, pIdx) => {
    const partId = `P${pIdx + 1}`;
    const clef = clefForVoice[voiceData.name];
    xml += `  <part id="${partId}">\n`;

    const voiceNotes = voiceData.notes.slice().sort((a, b) => {
      if (a.measure !== b.measure) return a.measure - b.measure;
      return a.position - b.position;
    });

    for (let m = 0; m < totalMeasures; m++) {
      const measureNotes = voiceNotes.filter(n => n.measure === m);
      xml += `    <measure number="${m + 1}">\n`;

      if (m === 0) {
        xml += `      <attributes>\n`;
        xml += `        <divisions>1024</divisions>\n`;
        xml += `        <key>\n`;
        xml += `          <fifths>${adjustedFifths}</fifths>\n`;
        xml += `        </key>\n`;
        xml += `        <time>\n`;
        xml += `          <beats>${beats}</beats>\n`;
        xml += `          <beat-type>${beatType}</beat-type>\n`;
        xml += `        </time>\n`;
        xml += `        <staves>1</staves>\n`;
        xml += `        <clef>\n`;
        xml += `          <sign>${clef.sign}</sign>\n`;
        xml += `          <line>${clef.line}</line>\n`;
        xml += `        </clef>\n`;
        xml += `      </attributes>\n`;
        xml += `      <direction directive="yes" placement="above">\n`;
        xml += `        <direction-type>\n`;
        xml += `          <metronome>\n`;
        xml += `            <beat-unit>quarter</beat-unit>\n`;
        xml += `            <per-minute>${tempo}</per-minute>\n`;
        xml += `          </metronome>\n`;
        xml += `        </direction-type>\n`;
        xml += `        <sound tempo="${tempo}"/>\n`;
        xml += `      </direction>\n`;
      }

      let currentPos = 0;
      measureNotes.forEach((note) => {
        if (note.position > currentPos) {
          const restDur = note.position - currentPos;
          const divisions = Math.round(restDur * 1024);
          if (divisions > 0) {
            xml += `      <note>\n`;
            xml += `        <rest/>\n`;
            xml += `        <duration>${divisions}</duration>\n`;
            xml += `        <voice>1</voice>\n`;
            xml += `        <type>${durationTypeFromBeats(restDur)}</type>\n`;
            xml += `      </note>\n`;
          }
        }
        const { step, octave } = pitchToStepOctave(note.pitch);
        const alter = noteAlter(note.accidental);
        xml += `      <note>\n`;
        xml += `        <pitch>\n`;
        xml += `          <step>${step}</step>\n`;
        if (alter !== 0) {
          xml += `          <alter>${alter}</alter>\n`;
        }
        xml += `          <octave>${octave}</octave>\n`;
        xml += `        </pitch>\n`;
        xml += `        <duration>${DURATION_TO_DIVISIONS[note.duration]}</duration>\n`;
        xml += `        <voice>1</voice>\n`;
        xml += `        <type>${DURATION_TO_TYPE[note.duration]}</type>\n`;
        if (note.accidental === '#') {
          xml += `        <accidental>sharp</accidental>\n`;
        } else if (note.accidental === 'b') {
          xml += `        <accidental>flat</accidental>\n`;
        } else if (note.accidental === 'n') {
          xml += `        <accidental>natural</accidental>\n`;
        }
        xml += `      </note>\n`;
        currentPos = note.position + durationToBeats(note.duration);
      });

      const measureBeats = beats;
      if (currentPos < measureBeats) {
        const restDur = measureBeats - currentPos;
        const divisions = Math.round(restDur * 1024);
        if (divisions > 0) {
          xml += `      <note>\n`;
          xml += `        <rest/>\n`;
          xml += `        <duration>${divisions}</duration>\n`;
          xml += `        <voice>1</voice>\n`;
          xml += `        <type>${durationTypeFromBeats(restDur)}</type>\n`;
          xml += `      </note>\n`;
        }
      }

      xml += `    </measure>\n`;
    }

    xml += `  </part>\n`;
  });

  xml += `</score-partwise>\n`;
  return xml;
}

function durationTypeFromBeats(beats: number): string {
  if (beats >= 4) return 'whole';
  if (beats >= 2) return 'half';
  if (beats >= 1) return 'quarter';
  if (beats >= 0.5) return 'eighth';
  return '16th';
}

export function downloadMXL(project: ScoreProject) {
  const xml = exportToMXL(project);
  const blob = new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name || 'score'}.musicxml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
