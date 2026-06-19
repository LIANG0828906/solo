import type { TimeSlot, Vote, BestTimeRecommendation, SlotVoteCount } from '@/types';

export function computeSlotVoteCounts(
  timeSlots: TimeSlot[],
  votes: Vote[]
): SlotVoteCount[] {
  const counts: Record<string, number> = {};
  timeSlots.forEach((slot) => {
    counts[slot.id] = 0;
  });

  votes.forEach((vote) => {
    vote.availableSlotIds.forEach((slotId) => {
      if (slotId in counts) {
        counts[slotId]++;
      }
    });
  });

  const totalVotes = votes.length;

  return timeSlots.map((slot) => ({
    slotId: slot.id,
    count: counts[slot.id],
    percentage: totalVotes > 0 ? (counts[slot.id] / totalVotes) * 100 : 0,
  }));
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function computeBestTime(
  timeSlots: TimeSlot[],
  votes: Vote[]
): BestTimeRecommendation | null {
  if (votes.length === 0) return null;

  const totalParticipants = votes.length;
  const minCoverage = 0.5;
  const minDurationMinutes = 60;

  const byDate: Record<string, TimeSlot[]> = {};
  timeSlots.forEach((slot) => {
    if (!byDate[slot.date]) {
      byDate[slot.date] = [];
    }
    byDate[slot.date].push(slot);
  });

  let bestResult: BestTimeRecommendation | null = null;
  let bestScore = -1;

  for (const date of Object.keys(byDate)) {
    const dateSlots = byDate[date];

    const timeCoverage: Record<number, number> = {};
    const slotIdsByMinute: Record<number, string[]> = {};

    dateSlots.forEach((slot) => {
      const startMin = parseTimeToMinutes(slot.startTime);
      const endMin = parseTimeToMinutes(slot.endTime);

      for (let m = startMin; m < endMin; m += 15) {
        if (!timeCoverage[m]) timeCoverage[m] = 0;
        if (!slotIdsByMinute[m]) slotIdsByMinute[m] = [];

        votes.forEach((vote) => {
          if (vote.availableSlotIds.includes(slot.id)) {
            timeCoverage[m]++;
          }
        });
        slotIdsByMinute[m].push(slot.id);
      }
    });

    const minutes = Object.keys(timeCoverage).map(Number).sort((a, b) => a - b);

    if (minutes.length === 0) continue;

    let windowStart = minutes[0];
    let currentMinCoverage = timeCoverage[minutes[0]];

    for (let i = 1; i < minutes.length; i++) {
      const currentMin = minutes[i];
      const prevMin = minutes[i - 1];

      if (currentMin - prevMin <= 15 && timeCoverage[currentMin] === currentMinCoverage) {
        continue;
      }

      const windowDuration = prevMin - windowStart + 15;
      const coverageRatio = currentMinCoverage / totalParticipants;
      const score = coverageRatio * windowDuration;

      if (
        windowDuration >= minDurationMinutes &&
        coverageRatio >= minCoverage &&
        score > bestScore
      ) {
        bestScore = score;
        bestResult = {
          date,
          startTime: minutesToTimeStr(windowStart),
          endTime: minutesToTimeStr(prevMin + 15),
          coverage: Math.round(coverageRatio * 100) / 100,
          participantCount: currentMinCoverage,
          totalParticipants,
        };
      }

      windowStart = currentMin;
      currentMinCoverage = timeCoverage[currentMin];
    }

    const lastMin = minutes[minutes.length - 1];
    const windowDuration = lastMin - windowStart + 15;
    const coverageRatio = currentMinCoverage / totalParticipants;
    const score = coverageRatio * windowDuration;

    if (
      windowDuration >= minDurationMinutes &&
      coverageRatio >= minCoverage &&
      score > bestScore
    ) {
      bestScore = score;
      bestResult = {
        date,
        startTime: minutesToTimeStr(windowStart),
        endTime: minutesToTimeStr(lastMin + 15),
        coverage: Math.round(coverageRatio * 100) / 100,
        participantCount: currentMinCoverage,
        totalParticipants,
      };
    }
  }

  if (bestResult) return bestResult;

  const slotCounts = computeSlotVoteCounts(timeSlots, votes);
  const sorted = [...slotCounts].sort((a, b) => b.count - a.count);

  if (sorted.length > 0) {
    const topSlot = timeSlots.find((s) => s.id === sorted[0].slotId);
    if (topSlot) {
      const duration = parseTimeToMinutes(topSlot.endTime) - parseTimeToMinutes(topSlot.startTime);
      if (duration >= minDurationMinutes) {
        return {
          date: topSlot.date,
          startTime: topSlot.startTime,
          endTime: topSlot.endTime,
          coverage: sorted[0].percentage / 100,
          participantCount: sorted[0].count,
          totalParticipants,
        };
      }
    }
  }

  if (sorted.length > 0) {
    const topSlot = timeSlots.find((s) => s.id === sorted[0].slotId);
    if (topSlot) {
      return {
        date: topSlot.date,
        startTime: topSlot.startTime,
        endTime: topSlot.endTime,
        coverage: sorted[0].percentage / 100,
        participantCount: sorted[0].count,
        totalParticipants,
      };
    }
  }

  return null;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getColorForUser(userName: string, totalUsers: number = 1): string {
  const GOLDEN_ANGLE = 137.508;
  const baseHash = hashCode(userName);

  const hue = (baseHash * GOLDEN_ANGLE) % 360;

  const saturationVariation = (baseHash % 20) - 10;
  const saturation = Math.max(60, Math.min(85, 70 + saturationVariation));

  const lightnessVariation = (baseHash % 15) - 7;
  const lightness = Math.max(45, Math.min(65, 55 + lightnessVariation));

  return hslToHex(hue, saturation, lightness);
}

export function generateDistinctColorPalette(count: number): string[] {
  const GOLDEN_ANGLE = 137.508;
  const palette: string[] = [];
  const baseHue = Math.floor(Math.random() * 360);

  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * GOLDEN_ANGLE) % 360;
    const saturation = 70 + (i % 3) * 5 - 5;
    const lightness = 55 + (i % 4) * 3 - 4;
    palette.push(hslToHex(hue, saturation, lightness));
  }

  return palette;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
