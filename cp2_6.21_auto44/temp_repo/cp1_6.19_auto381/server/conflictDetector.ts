import { v4 as uuidv4 } from 'uuid';
import type {
  SeatLayout,
  Conflict,
  SeatPosition,
  Student,
  Severity,
} from '../src/types';

const ROWS = 6;
const BACK_ROWS_THRESHOLD = 3;

function findStudentPosition(
  layout: SeatLayout,
  predicate: (s: Student) => boolean,
): SeatPosition | null {
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      const seat = layout[r][c];
      if (seat && predicate(seat)) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function findAllStudents(
  layout: SeatLayout,
  predicate: (s: Student) => boolean,
): Array<{ pos: SeatPosition; student: Student }> {
  const result: Array<{ pos: SeatPosition; student: Student }> = [];
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      const seat = layout[r][c];
      if (seat && predicate(seat)) {
        result.push({ pos: { row: r, col: c }, student: seat });
      }
    }
  }
  return result;
}

function getSeatLabel(pos: SeatPosition): string {
  const rowLabel = String.fromCharCode(65 + pos.row);
  return `${rowLabel}${pos.col + 1}`;
}

function createConflict(
  seats: [SeatPosition, SeatPosition],
  type: Conflict['type'],
  severity: Severity,
  description: string,
  suggestion: string,
): Conflict {
  return {
    id: uuidv4(),
    seats,
    type,
    severity,
    description,
    suggestion,
  };
}

function findFrontEmptySeat(layout: SeatLayout): SeatPosition | null {
  for (let r = 0; r < BACK_ROWS_THRESHOLD; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      if (!layout[r][c]) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function findAnyEmptySeat(
  layout: SeatLayout,
  exclude: SeatPosition[],
): SeatPosition | null {
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      if (!layout[r][c] && !exclude.some((p) => p.row === r && p.col === c)) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function isAdjacent(a: SeatPosition, b: SeatPosition): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 0);
}

export function detectConflicts(layout: SeatLayout): Conflict[] {
  const conflicts: Conflict[] = [];

  const visionStudents = findAllStudents(layout, (s) =>
    s.specialNeeds.includes('vision_impaired'),
  );

  visionStudents.forEach(({ pos, student }) => {
    if (pos.row >= BACK_ROWS_THRESHOLD) {
      const frontSeat = findFrontEmptySeat(layout);
      const suggestion = frontSeat
        ? `建议将${student.name}移至${getSeatLabel(frontSeat)}`
        : `建议将${student.name}与前排学生交换座位`;

      conflicts.push(
        createConflict(
          [pos, pos],
          'vision_back',
          'must_fix',
          `${student.name}（${getSeatLabel(pos)}）：视力不佳学生不应靠后`,
          suggestion,
        ),
      );
    }
  });

  const hearingStudents = findAllStudents(layout, (s) =>
    s.specialNeeds.includes('hearing_impaired'),
  );

  hearingStudents.forEach(({ pos, student }) => {
    if (pos.row >= BACK_ROWS_THRESHOLD) {
      const frontSeat = findFrontEmptySeat(layout);
      const suggestion = frontSeat
        ? `建议将${student.name}移至${getSeatLabel(frontSeat)}`
        : `建议将${student.name}与前排学生交换座位`;

      conflicts.push(
        createConflict(
          [pos, pos],
          'hearing_back',
          'must_fix',
          `${student.name}（${getSeatLabel(pos)}）：听力障碍学生不应靠后`,
          suggestion,
        ),
      );
    }
  });

  const noisyStudents = findAllStudents(layout, (s) =>
    s.specialNeeds.includes('noisy'),
  );

  const checkedPairs = new Set<string>();
  noisyStudents.forEach(({ pos: posA, student: studentA }, i) => {
    noisyStudents.forEach(({ pos: posB, student: studentB }, j) => {
      if (i >= j) return;
      const pairKey = `${i}-${j}`;
      if (checkedPairs.has(pairKey)) return;

      if (isAdjacent(posA, posB)) {
        checkedPairs.add(pairKey);
        const emptySeat = findAnyEmptySeat(layout, [posA, posB]);
        const suggestion = emptySeat
          ? `建议将${studentB.name}移至${getSeatLabel(emptySeat)}`
          : `建议将${studentA.name}与${studentB.name}分开，至少隔一个座位`;

        conflicts.push(
          createConflict(
            [posA, posB],
            'noisy_adjacent',
            'suggest_fix',
            `${studentA.name}（${getSeatLabel(posA)}）与${studentB.name}（${getSeatLabel(posB)}）：吵闹学生不应相邻`,
            suggestion,
          ),
        );
      }
    });
  });

  return conflicts;
}
