import type { NoteData } from '@/stores/useScoreStore';

const LINE_SPACING = 12;
const LEFT_MARGIN = 60;
const NOTE_SPACING = 50;
const SVG_HEIGHT = 200;
const STAFF_Y = (SVG_HEIGHT - 4 * LINE_SPACING) / 2;
const E4_REF = 30;
const PITCH_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function pitchToY(pitch: string, octave: number): number {
  const pos = octave * 7 + (PITCH_INDEX[pitch] ?? 0) - E4_REF;
  return STAFF_Y + 4 * LINE_SPACING - pos * (LINE_SPACING / 2);
}

function getLedgerYs(pitch: string, octave: number): number[] {
  const pos = octave * 7 + (PITCH_INDEX[pitch] ?? 0) - E4_REF;
  const ys: number[] = [];
  if (pos < 0) for (let e = -2; e >= pos; e -= 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  if (pos > 8) for (let e = 10; e <= pos; e += 2) ys.push(STAFF_Y + 4 * LINE_SPACING - e * (LINE_SPACING / 2));
  return ys;
}

function buildSvg(notes: NoteData[], tempo: number): string {
  const sorted = [...notes].sort((a, b) => a.order - b.order);
  const width = Math.max(800, LEFT_MARGIN + sorted.length * NOTE_SPACING + 60);
  const staffBottom = STAFF_Y + 4 * LINE_SPACING;
  const totalHeight = staffBottom + 80;

  let staffLines = '';
  for (let i = 0; i < 5; i++) {
    const y = STAFF_Y + i * LINE_SPACING;
    staffLines += `<line x1="40" y1="${y}" x2="${width - 40}" y2="${y}" stroke="#000" stroke-width="0.8"/>`;
  }
  staffLines += `<line x1="40" y1="${STAFF_Y}" x2="40" y2="${staffBottom}" stroke="#000" stroke-width="1.5"/>`;
  staffLines += `<line x1="${width - 40}" y1="${STAFF_Y}" x2="${width - 40}" y2="${staffBottom}" stroke="#000" stroke-width="1.5"/>`;

  const TYPE_LABELS: Record<string, string> = { whole: '全音符', half: '二分音符', quarter: '四分音符', eighth: '八分音符' };

  let noteElements = '';
  sorted.forEach((note) => {
    const x = LEFT_MARGIN + note.order * NOTE_SPACING;
    const y = pitchToY(note.pitch, note.octave);
    const hollow = note.type === 'whole' || note.type === 'half';
    const ledgerYs = getLedgerYs(note.pitch, note.octave);

    for (const ly of ledgerYs) {
      noteElements += `<line x1="${x - 12}" y1="${ly}" x2="${x + 12}" y2="${ly}" stroke="#000" stroke-width="0.8"/>`;
    }

    noteElements += `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${hollow ? 'none' : '#000'}" stroke="#000" stroke-width="1.2" transform="rotate(-15,${x},${y})"/>`;

    if (note.type !== 'whole') {
      noteElements += `<line x1="${x + 8}" y1="${y}" x2="${x + 8}" y2="${y - 30}" stroke="#000" stroke-width="1.2"/>`;
    }

    if (note.type === 'eighth') {
      noteElements += `<path d="M${x + 8},${y - 30} Q${x + 16},${y - 22} ${x + 10},${y - 14}" fill="none" stroke="#000" stroke-width="1.2"/>`;
    }

    noteElements += `<text x="${x}" y="${y + 20}" font-size="8" text-anchor="middle" fill="#666" font-family="sans-serif">${note.pitch}${note.octave}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="40" y="24" font-size="18" font-family="serif" font-weight="bold">NoteScribe 乐谱</text>
    <text x="${width - 40}" y="24" font-size="12" font-family="sans-serif" text-anchor="end" fill="#666">Tempo: ${tempo} BPM</text>
    <text x="40" y="42" font-size="11" font-family="sans-serif" fill="#999">共 ${sorted.length} 个音符</text>
    ${staffLines}
    ${noteElements}
  </svg>`;
}

export function exportAsPDF(notes: NoteData[], tempo: number): void {
  const svg = buildSvg(notes, tempo);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>NoteScribe 乐谱导出</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  @media print {
    body { margin: 0; }
    svg { width: 100%; height: auto; max-height: 90vh; }
  }
  body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
</style>
</head>
<body>
${svg}
<script>
  setTimeout(function() { window.print(); }, 300);
</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
