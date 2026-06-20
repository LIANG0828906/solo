import type { Poll, TimeOption, ScheduleResult, PreferenceType } from '../types';

const PREFERENCE_WEIGHTS: Record<PreferenceType, number> = {
  preferred: 1,
  available: 0.5,
  unavailable: 0,
};

function parseTime(date: string, time: string): number {
  return new Date(`${date}T${time}`).getTime();
}

function hasTimeConflict(a: TimeOption, b: TimeOption): boolean {
  if (a.date !== b.date) return false;
  const aStart = parseTime(a.date, a.startTime);
  const aEnd = parseTime(a.date, a.endTime);
  const bStart = parseTime(b.date, b.startTime);
  const bEnd = parseTime(b.date, b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export function calculateSchedule(poll: Poll): ScheduleResult {
  const startTime = performance.now();

  const { options, votes, members } = poll;
  const totalMembers = members.length;

  if (options.length === 0 || totalMembers === 0) {
    return {
      bestOption: null,
      bestScore: 0,
      optionScores: [],
      totalMembers,
      satisfactionRating: 0,
    };
  }

  const maxPossibleScore = totalMembers * PREFERENCE_WEIGHTS.preferred;

  const optionScores = options.map((option) => {
    let score = 0;
    let availableCount = 0;
    let preferredCount = 0;

    votes.forEach((vote) => {
      const pref = vote.preferences[option.id];
      if (pref) {
        score += PREFERENCE_WEIGHTS[pref];
        if (pref === 'available') availableCount++;
        if (pref === 'preferred') {
          availableCount++;
          preferredCount++;
        }
      }
    });

    return { option, score, availableCount, preferredCount };
  });

  optionScores.sort((a, b) => b.score - a.score);

  const selected: typeof optionScores = [];
  for (const candidate of optionScores) {
    const conflicts = selected.some((s) => hasTimeConflict(s.option, candidate.option));
    if (!conflicts) {
      selected.push(candidate);
    }
  }

  const bestOption = selected.length > 0 ? selected[0].option : null;
  const bestScore = selected.length > 0 ? selected[0].score : 0;

  const satisfactionRatio = maxPossibleScore > 0 ? bestScore / maxPossibleScore : 0;
  const satisfactionRating = Math.max(1, Math.min(5, Math.round(satisfactionRatio * 5)));

  const elapsed = performance.now() - startTime;
  if (elapsed > 100) {
    console.warn(`Schedule calculation took ${elapsed.toFixed(2)}ms, exceeding 100ms limit`);
  }

  return {
    bestOption,
    bestScore,
    optionScores,
    totalMembers,
    satisfactionRating,
  };
}

export function formatTimeRange(option: TimeOption): string {
  return `${option.date} ${option.startTime}-${option.endTime}`;
}

export function generateSummary(result: ScheduleResult): string {
  if (!result.bestOption) {
    return '暂无可用日程';
  }
  const available = result.optionScores.find(
    (s) => s.option.id === result.bestOption!.id
  )?.availableCount ?? 0;
  return `选定时间：${formatTimeRange(result.bestOption)}，${available}人可参加`;
}
