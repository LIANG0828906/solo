import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { detectConflicts } from './conflictDetector';
import type {
  Student,
  SeatLayout,
  Conflict,
  Grade,
  StudentNeed,
} from '../src/types';
import { ROWS, COLS } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function createEmptyLayout(): SeatLayout {
  const layout: SeatLayout = [];
  for (let r = 0; r < ROWS; r++) {
    const row: (Student | null)[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(null);
    }
    layout.push(row);
  }
  return layout;
}

const mockStudents: Student[] = [
  { id: uuidv4(), name: '张三', grade: 'freshman', specialNeeds: ['vision_impaired'] },
  { id: uuidv4(), name: '李四', grade: 'freshman', specialNeeds: [] },
  { id: uuidv4(), name: '王五', grade: 'sophomore', specialNeeds: ['hearing_impaired'] },
  { id: uuidv4(), name: '赵六', grade: 'sophomore', specialNeeds: ['noisy'] },
  { id: uuidv4(), name: '孙七', grade: 'junior', specialNeeds: [] },
  { id: uuidv4(), name: '周八', grade: 'junior', specialNeeds: ['noisy'] },
  { id: uuidv4(), name: '吴九', grade: 'senior', specialNeeds: [] },
  { id: uuidv4(), name: '郑十', grade: 'senior', specialNeeds: ['vision_impaired'] },
  { id: uuidv4(), name: '陈一', grade: 'freshman', specialNeeds: [] },
  { id: uuidv4(), name: '林二', grade: 'sophomore', specialNeeds: [] },
  { id: uuidv4(), name: '黄三', grade: 'junior', specialNeeds: ['hearing_impaired'] },
  { id: uuidv4(), name: '杨四', grade: 'senior', specialNeeds: [] },
  { id: uuidv4(), name: '刘五', grade: 'freshman', specialNeeds: ['noisy'] },
  { id: uuidv4(), name: '高六', grade: 'sophomore', specialNeeds: [] },
  { id: uuidv4(), name: '马七', grade: 'junior', specialNeeds: [] },
  { id: uuidv4(), name: '朱八', grade: 'senior', specialNeeds: [] },
];

let seatLayout: SeatLayout = createEmptyLayout();

seatLayout[3][2] = mockStudents[0];
seatLayout[4][5] = mockStudents[2];
seatLayout[0][1] = mockStudents[3];
seatLayout[0][2] = mockStudents[5];
seatLayout[5][0] = mockStudents[7];
seatLayout[1][3] = mockStudents[1];

app.get('/api/seats', (_req, res) => {
  const assignedStudentIds = new Set<string>();
  for (const row of seatLayout) {
    for (const seat of row) {
      if (seat) {
        assignedStudentIds.add(seat.id);
      }
    }
  }
  const unassignedStudents = mockStudents.filter(
    (s) => !assignedStudentIds.has(s.id),
  );
  res.json({ layout: seatLayout, students: unassignedStudents });
});

app.put('/api/seats/:row/:col', (req, res) => {
  const row = parseInt(req.params.row, 10);
  const col = parseInt(req.params.col, 10);
  const { student } = req.body as { student: Student | null };

  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    res.status(400).json({ success: false, error: 'Invalid seat position' });
    return;
  }

  if (student) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (seatLayout[r][c]?.id === student.id) {
          seatLayout[r][c] = null;
        }
      }
    }
  }

  seatLayout[row][col] = student;
  res.json({ success: true, layout: seatLayout });
});

app.put('/api/seats/reset', (_req, res) => {
  seatLayout = createEmptyLayout();
  res.json({ success: true, layout: seatLayout });
});

app.post('/api/check-conflicts', (req, res) => {
  const { layout } = req.body as { layout: SeatLayout };
  const conflicts: Conflict[] = detectConflicts(layout);
  res.json({ conflicts });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
