import type { NoteData } from '@/stores/useScoreStore';

const NOTE_HEAD_SYMBOLS: Record<string, string> = {
  whole: '\u25CB',
  half: '\u25CB',
  quarter: '\u25CF',
  eighth: '\u25CF',
};

const STAFF_LINE_COUNT = 5;
const LINE_SPACING = 16;

function buildSvg(notes: NoteData[], tempo: number): string {
  const width = Math.max(800, notes.length * 60 + 160);
  const staffTop = 60;
  const staffBottom = staffTop + (STAFF_LINE_COUNT - 1) * LINE_SPACING;

  let staffLines = '';
  for (let i = 0; i < STAFF_LINE_COUNT; i++) {
    const y = staffTop + i * LINE_SPACING;
    staffLines += `<line x1="60" y1="${y}" x2="${width - 60}" y2="${y}" stroke="#000" stroke-width="1"/>`;
  }

  staffLines += `
    <line x1="60" y1="${staffTop}" x2="60" y2="${staffBottom}" stroke="#000" stroke-width="2"/>
    <line x1="${width - 60}" y1="${staffTop}" x2="${width - 60}" y2="${staffBottom}" stroke="#000" stroke-width="2"/>
  `;

  let noteElements = '';
  const sorted = [...notes].sort((a, b) => a.x - b.x);
  const step = (width - 160) / Math.max(sorted.length, 1);

  sorted.forEach((note, i) => {
    const x = 100 + i * step;
    const y = staffTop + (6 - (PITCH_VALUES[note.pitch] ?? 0)) * (LINE_SPACING / 2) + (4 - note.octave) * LINE_SPACING * 3.5;
    const clampedY = Math.max(staffTop - 20, Math.min(staffBottom + 20, y));

    const head = NOTE_HEAD_SYMBOLS[note.type] ?? '\u25CF';
    const hasStem = note.type !== 'whole';
    const stemDirection = clampedY < (staffTop + staffBottom) / 2 ? 1 : -1;

    noteElements += `<text x="${x}" y="${clampedY}" font-size="20" text-anchor="middle" dominant-baseline="middle" font-family="serif">${head}</text>`;

    if (hasStem) {
      const stemY1 = clampedY;
      const stemY2 = clampedY + stemDirection * 35;
      noteElements += `<line x1="${x + 6}" y1="${stemY1}" x2="${x + 6}" y2="${stemY2}" stroke="#000" stroke-width="1.5"/>`;

      if (note.type === 'eighth') {
        const flagX = x + 6;
        const flagY = stemDirection > 0 ? stemY2 : stemY2;
        noteElements += `<path d="M${flagX},${flagY} Q${flagX + 10},${flagY + stemDirection * 8} ${flagX + 3},${flagY + stemDirection * 16}" fill="none" stroke="#000" stroke-width="1.5"/>`;
      }
    }

    if (note.pitch.length === 2 && note.pitch[1] === '#') {
      noteElements += `<text x="${x - 16}" y="${clampedY}" font-size="14" text-anchor="middle" dominant-baseline="middle" font-family="serif">\u266F</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${staffBottom + 80}" viewBox="0 0 ${width} ${staffBottom + 80}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width / 2}" y="30" font-size="20" text-anchor="middle" font-family="serif">Tempo: ${tempo} BPM</text>
    ${staffLines}
    ${noteElements}
  </svg>`;
}

const PITCH_VALUES: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

export function exportAsPDF(notes: NoteData[], tempo: number): void {
  const svg = buildSvg(notes, tempo);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Score Export</title>
<style>
  @media print {
    body { margin: 0; }
    svg { width: 100%; height: auto; }
  }
  body { margin: 20px; display: flex; justify-content: center; }
</style>
</head>
<body>
${svg}
<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
