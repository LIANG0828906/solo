import type { User, Schedule, Recommendation, ParticipantLocalTime } from '@/shared/types';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function localToUtcMinutes(localMinutes: number, utcOffset: number): number {
  return ((localMinutes - utcOffset * 60) % 1440 + 1440) % 1440;
}

function utcToLocalMinutes(utcMinutes: number, utcOffset: number): number {
  return ((utcMinutes + utcOffset * 60) % 1440 + 1440) % 1440;
}

function intersectWindows(
  a: { start: number; end: number },
  b: { start: number; end: number }
): { start: number; end: number } | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

function isSlotConflicting(
  slotStart: Date,
  slotEnd: Date,
  schedules: Schedule[]
): boolean {
  return schedules.some((s) => {
    const schedStart = new Date(`${s.date}T${s.startTime}`);
    const schedEnd = new Date(`${s.date}T${s.endTime}`);
    return slotStart < schedEnd && slotEnd > schedStart;
  });
}

export function calculateOptimalSlots(
  users: User[],
  duration: number,
  existingSchedules: Schedule[]
): Recommendation[] {
  if (users.length === 0) return [];

  const today = new Date();
  const daysToCheck = 7;
  const candidates: {
    start: Date;
    end: Date;
    overlapCount: number;
    participantLocalTimes: ParticipantLocalTime[];
  }[] = [];

  for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    const userWindows = users.map((u) => {
      const localStart = timeToMinutes(u.workStart);
      const localEnd = timeToMinutes(u.workEnd);
      return {
        userId: u.id,
        utcOffset: u.utcOffset,
        utcStart: localToUtcMinutes(localStart, u.utcOffset),
        utcEnd: localToUtcMinutes(localEnd, u.utcOffset),
      };
    });

    let overlap: { start: number; end: number } | null = {
      start: userWindows[0].utcStart,
      end: userWindows[0].utcEnd,
    };

    for (let i = 1; i < userWindows.length; i++) {
      overlap = intersectWindows(overlap!, { start: userWindows[i].utcStart, end: userWindows[i].utcEnd });
      if (!overlap) break;
    }

    if (!overlap) continue;

    const baseDate = new Date(`${dateStr}T00:00:00Z`);

    for (
      let slotStartMin = overlap.start;
      slotStartMin + duration <= overlap.end;
      slotStartMin += 30
    ) {
      const slotEndMin = slotStartMin + duration;

      const slotStart = new Date(baseDate.getTime() + slotStartMin * 60000);
      const slotEnd = new Date(baseDate.getTime() + slotEndMin * 60000);

      const availableCount = userWindows.filter(
        (w) => slotStartMin >= w.utcStart && slotEndMin <= w.utcEnd
      ).length;

      if (availableCount === 0) continue;

      const participantLocalTimes = users.map((u) => {
        const localMin = utcToLocalMinutes(slotStartMin, u.utcOffset);
        return {
          userId: u.id,
          localTime: minutesToTime(localMin),
        };
      });

      candidates.push({
        start: slotStart,
        end: slotEnd,
        overlapCount: availableCount,
        participantLocalTimes,
      });
    }
  }

  const scored = candidates.map((c) => {
    const overlapScore = c.overlapCount / users.length;
    const noConflict = isSlotConflicting(c.start, c.end, existingSchedules) ? 0 : 1;
    const score = 0.6 * overlapScore + 0.4 * noConflict;
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((c) => ({
    startTime: c.start.toISOString(),
    endTime: c.end.toISOString(),
    overlapCount: c.overlapCount,
    overlapPercent: Math.round((c.overlapCount / users.length) * 100),
    participantLocalTimes: c.participantLocalTimes,
  }));
}
