import { type PieceColor, type PieceType, type Position, getPieceName, evaluateWinRate } from './gameLogic';

export interface MoveRecord {
  moveNumber: number;
  color: PieceColor;
  from: Position;
  to: Position;
  pieceType: PieceType;
  captured?: PieceType;
  timestamp: number;
  timeSpent: number;
  winRateBefore: number;
  winRateAfter: number;
}

export interface AnalysisReport {
  totalMoves: number;
  avgTimePerMove: number;
  redAvgTime: number;
  blackAvgTime: number;
  turningPoints: number[];
  mistakes: number;
  highlights: string[];
  summary: string;
  moveRecords: MoveRecord[];
}

let moveRecords: MoveRecord[] = [];
let moveCounter = 0;
let lastMoveTime = 0;

export function resetAnalysis(): void {
  moveRecords = [];
  moveCounter = 0;
  lastMoveTime = 0;
}

export function recordMove(
  color: PieceColor,
  from: Position,
  to: Position,
  pieceType: PieceType,
  captured: PieceType | undefined
): MoveRecord {
  const now = Date.now();
  const timeSpent = lastMoveTime > 0 ? (now - lastMoveTime) / 1000 : 0;
  lastMoveTime = now;

  moveCounter++;

  const winRateBefore = evaluateWinRate();

  const record: MoveRecord = {
    moveNumber: moveCounter,
    color,
    from,
    to,
    pieceType,
    captured,
    timestamp: now,
    timeSpent: Math.round(timeSpent * 10) / 10,
    winRateBefore,
    winRateAfter: winRateBefore
  };

  const winRateAfter = evaluateWinRate();
  record.winRateAfter = winRateAfter;

  moveRecords.push(record);
  return record;
}

export function getMoveRecords(): MoveRecord[] {
  return [...moveRecords];
}

export function getWinRate(): number {
  return evaluateWinRate();
}

export function detectTurningPoints(): number[] {
  const points: number[] = [];
  for (const record of moveRecords) {
    const change = Math.abs(record.winRateAfter - record.winRateBefore);
    if (change >= 20) {
      points.push(record.moveNumber);
    }
  }
  return points;
}

export function generateReport(): AnalysisReport {
  const totalMoves = moveRecords.length;
  const redMoves = moveRecords.filter(r => r.color === 'red');
  const blackMoves = moveRecords.filter(r => r.color === 'black');

  const avgTimePerMove = totalMoves > 0
    ? Math.round((moveRecords.reduce((s, r) => s + r.timeSpent, 0) / totalMoves) * 10) / 10
    : 0;

  const redAvgTime = redMoves.length > 0
    ? Math.round((redMoves.reduce((s, r) => s + r.timeSpent, 0) / redMoves.length) * 10) / 10
    : 0;

  const blackAvgTime = blackMoves.length > 0
    ? Math.round((blackMoves.reduce((s, r) => s + r.timeSpent, 0) / blackMoves.length) * 10) / 10
    : 0;

  const turningPoints = detectTurningPoints();

  let mistakes = 0;
  const highlights: string[] = [];

  for (const record of moveRecords) {
    if (record.color === 'red') {
      if (record.winRateAfter < record.winRateBefore - 15) {
        mistakes++;
      }
      if (record.winRateAfter > record.winRateBefore + 15) {
        const moveName = formatMoveName(record);
        highlights.push(moveName);
      }
    }
  }

  const summary = buildSummary(totalMoves, avgTimePerMove, mistakes, highlights, turningPoints);

  return {
    totalMoves,
    avgTimePerMove,
    redAvgTime,
    blackAvgTime,
    turningPoints,
    mistakes,
    highlights,
    summary,
    moveRecords: [...moveRecords]
  };
}

function formatMoveName(record: MoveRecord): string {
  const pieceChar = getPieceName(record.pieceType, record.color);
  const colorLabel = record.color === 'red' ? '红' : '黑';
  let capturedStr = '';
  if (record.captured) {
    capturedStr = '吃' + getPieceName(record.captured, record.color === 'red' ? 'black' : 'red');
  }
  return `第${record.moveNumber}着 ${colorLabel}${pieceChar}(${record.from.col},${record.from.row})→(${record.to.col},${record.to.row})${capturedStr}`;
}

function buildSummary(
  totalMoves: number,
  avgTime: number,
  mistakes: number,
  highlights: string[],
  turningPoints: number[]
): string {
  const parts: string[] = [];

  parts.push(`本局共${totalMoves}着，平均每步用时${avgTime}秒。`);

  if (mistakes > 0) {
    parts.push(`红方出现${mistakes}次失误。`);
  } else {
    parts.push('红方表现稳健，无明显失误。');
  }

  if (highlights.length > 0) {
    parts.push(`亮点着法：${highlights.join('、')}。`);
  }

  if (turningPoints.length > 0) {
    parts.push(`关键转折点出现在第${turningPoints.join('、')}着。`);
  }

  const lastRecord = moveRecords[moveRecords.length - 1];
  if (lastRecord) {
    const redWinRate = lastRecord.winRateAfter;
    if (redWinRate >= 80) {
      parts.push('红方优势明显，胜局已定。');
    } else if (redWinRate <= 20) {
      parts.push('黑方优势明显，红方需谨慎应对。');
    } else {
      parts.push('局面胶着，胜负未分。');
    }
  }

  return parts.join('');
}

export function exportData(format: 'json' | 'txt'): string {
  const report = generateReport();

  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const lines: string[] = [];
  lines.push('===== 古弈残局 复盘分析报告 =====');
  lines.push('');
  lines.push(`总步数：${report.totalMoves}`);
  lines.push(`平均每步用时：${report.avgTimePerMove}秒`);
  lines.push(`红方平均用时：${report.redAvgTime}秒`);
  lines.push(`黑方平均用时：${report.blackAvgTime}秒`);
  lines.push(`失误次数：${report.mistakes}`);
  lines.push(`亮点着法：${report.highlights.join('、') || '无'}`);
  lines.push(`转折点：${report.turningPoints.length > 0 ? '第' + report.turningPoints.join('、') + '着' : '无'}`);
  lines.push('');
  lines.push('--- 着法记录 ---');

  for (const r of report.moveRecords) {
    const colorLabel = r.color === 'red' ? '红' : '黑';
    const pieceChar = getPieceName(r.pieceType, r.color);
    const capturedStr = r.captured ? ' 吃' + getPieceName(r.captured, r.color === 'red' ? 'black' : 'red') : '';
    const star = report.turningPoints.includes(r.moveNumber) ? ' ★' : '';
    lines.push(
      `第${r.moveNumber}着 ${colorLabel}${pieceChar} (${r.from.col},${r.from.row})→(${r.to.col},${r.to.row})${capturedStr} 用时${r.timeSpent}秒 胜率${Math.round(r.winRateAfter)}%${star}`
    );
  }

  lines.push('');
  lines.push('--- 总结 ---');
  lines.push(report.summary);

  return lines.join('\n');
}

export function downloadExport(format: 'json' | 'txt'): void {
  const content = exportData(format);
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `残局复盘.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
