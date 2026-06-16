export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface SeatPosition {
  x: number;
  y: number;
}

export interface Seat {
  id: string;
  position: SeatPosition;
  seatNumber: string;
  employeeId: string | null;
  status: 'free' | 'occupied' | 'pending_approval';
}

export interface SwapRequest {
  id: string;
  employeeId: string;
  fromSeatId: string;
  toSeatId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export const SOFT_COLORS = [
  '#5C6BC0', '#42A5F5', '#26A69A', '#66BB6A',
  '#FFCA28', '#FF7043', '#AB47BC', '#EC407A',
  '#8D6E63', '#78909C', '#7E57C2', '#29B6F6',
];

export function getEmployeeColor(employeeId: string): string {
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = employeeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SOFT_COLORS[Math.abs(hash) % SOFT_COLORS.length];
}

export function getNameInitials(name: string): string {
  if (!name) return '';
  const chars = name.replace(/\s/g, '');
  if (chars.length >= 2) {
    return chars.slice(0, 2).toUpperCase();
  }
  return chars.toUpperCase();
}

export const INITIAL_SEATS: Seat[] = Array.from({ length: 20 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return {
    id: `seat-${i + 1}`,
    position: { x: col, y: row },
    seatNumber: `W${String(i + 1).padStart(3, '0')}`,
    employeeId: null,
    status: 'free' as const,
  };
});

export const EMPLOYEES: Employee[] = [
  { id: 'emp-01', name: '张伟', avatarUrl: '' },
  { id: 'emp-02', name: '王芳', avatarUrl: '' },
  { id: 'emp-03', name: '李娜', avatarUrl: '' },
  { id: 'emp-04', name: '刘洋', avatarUrl: '' },
  { id: 'emp-05', name: '陈明', avatarUrl: '' },
  { id: 'emp-06', name: '杨静', avatarUrl: '' },
  { id: 'emp-07', name: '赵磊', avatarUrl: '' },
  { id: 'emp-08', name: '黄丽', avatarUrl: '' },
  { id: 'emp-09', name: '周强', avatarUrl: '' },
  { id: 'emp-10', name: '吴敏', avatarUrl: '' },
  { id: 'emp-11', name: '徐涛', avatarUrl: '' },
  { id: 'emp-12', name: '孙艳', avatarUrl: '' },
  { id: 'emp-13', name: '马超', avatarUrl: '' },
  { id: 'emp-14', name: '朱红', avatarUrl: '' },
  { id: 'emp-15', name: '胡军', avatarUrl: '' },
];

export const DEFAULT_SEAT_ASSIGNMENTS: Record<string, string> = {
  'seat-1': 'emp-01',
  'seat-2': 'emp-02',
  'seat-3': 'emp-03',
  'seat-4': 'emp-04',
  'seat-5': 'emp-05',
  'seat-6': 'emp-06',
  'seat-7': 'emp-07',
  'seat-8': 'emp-08',
  'seat-9': 'emp-09',
  'seat-10': 'emp-10',
  'seat-11': 'emp-11',
  'seat-12': 'emp-12',
};
