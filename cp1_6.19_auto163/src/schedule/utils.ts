import type { Rehearsal, ConflictRecord } from '../types';

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const detectConflicts = (
  target: Rehearsal,
  all: Rehearsal[],
): ConflictRecord[] => {
  const conflicts: ConflictRecord[] = [];
  const targetStart = timeToMinutes(target.startTime);
  const targetEnd = targetStart + target.durationMinutes;

  for (const other of all) {
    if (other.id === target.id) continue;
    if (other.date !== target.date) continue;

    const otherStart = timeToMinutes(other.startTime);
    const otherEnd = otherStart + other.durationMinutes;

    if (!(targetStart < otherEnd && otherStart < targetEnd)) continue;

    const overlappingMembers = target.participantIds.filter((id) =>
      other.participantIds.includes(id),
    );

    for (const memberId of overlappingMembers) {
      conflicts.push({
        memberId,
        conflictingRehearsalId: other.id,
      });
    }
  }

  return conflicts;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分`;
};

export const formatRange = (start: string, durationMin: number): string => {
  const startMin = timeToMinutes(start);
  const endMin = startMin + durationMin;
  const h = Math.floor(endMin / 60);
  const m = endMin % 60;
  const end = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return `${start} - ${end}`;
};

export const getWeekDates = (base: Date): Date[] => {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push(nd);
  }
  return dates;
};

export const dateToString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const stringToDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
